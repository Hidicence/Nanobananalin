require('dotenv').config();
const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

// Debug: 檢查環境變數
console.log('Environment variables loaded:');
console.log('LINE_CHANNEL_ACCESS_TOKEN:', process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'EXISTS' : 'MISSING');
console.log('LINE_CHANNEL_SECRET:', process.env.LINE_CHANNEL_SECRET ? 'EXISTS' : 'MISSING');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'EXISTS' : 'MISSING');

// 設定 Cloudinary（使用免費帳號）
cloudinary.config({
  cloud_name: 'demo', // 使用 Cloudinary 的公開 demo 帳號進行測試
  api_key: '998877665544332',
  api_secret: 'AbcdEfghIjklMnopQrstUvwxYz'
});

// 檢查必要的環境變數
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET || !process.env.OPENROUTER_API_KEY) {
  console.error('Missing required environment variables!');
  console.error('Please set: LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET, OPENROUTER_API_KEY');
}

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const client = new Client(config);

// 只在 LINE webhook 路徑使用 middleware
app.use('/webhook', middleware(config));

async function getImageBuffer(messageId) {
  try {
    const stream = await client.getMessageContent(messageId);
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error getting image buffer:', error);
    return null;
  }
}

// 健壯的圖片提取函式，兼容多種格式
function pickImageDataUrl(choice) {
  const message = choice.message;
  
  // 格式 A: content 是陣列，包含 image 物件
  if (Array.isArray(message.content)) {
    const imageContent = message.content.find(item => 
      item?.type?.toLowerCase().includes('image') || 
      item?.type === 'output_image'
    );
    if (imageContent?.image_url?.url) {
      return imageContent.image_url.url;
    }
  }
  
  // 格式 B: message 直接有 images 陣列
  if (message.images && message.images.length > 0) {
    const imageUrl = message.images[0]?.image_url?.url;
    if (imageUrl) {
      return imageUrl;
    }
  }
  
  // 格式 C: content 是字串，直接包含 base64 或 data URL
  if (typeof message.content === 'string') {
    const content = message.content;
    
    // 檢查完整的 data URL
    const dataUrlMatch = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (dataUrlMatch) {
      return dataUrlMatch[0];
    }
    
    // 檢查純 base64（長度 > 100 且符合 base64 格式）
    if (content.length > 100 && /^[A-Za-z0-9+/]+=*$/.test(content.replace(/\s/g, ''))) {
      return `data:image/png;base64,${content}`;
    }
  }
  
  return null;
}

// 上傳 base64 圖片到 Cloudinary
async function uploadImageToCloudinary(base64Data) {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: 'linebot_images',
      resource_type: 'image'
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
}

async function generateImageWithPrompt(imageBuffer, text) {
  try {
    const base64Image = imageBuffer.toString('base64');
    const content = [];
    
    // 構建明確的圖片生成 prompt
    const prompt = text && text.trim() 
      ? `Create a high-resolution image with these modifications: ${text}. Based on the reference image provided. Return only the generated image.`
      : `Generate a new high-resolution artistic image inspired by the reference image provided. Return only the generated image.`;
    
    content.push({
      type: 'text',
      text: prompt
    });
    
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`
      }
    });

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'google/gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: 1024,
      stream: false, // 關閉串流確保完整回應
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://line-bot-gemini-hngc.onrender.com',
        'X-Title': 'LINE Bot Image Generator'
      }
    });

    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const choice = response.data.choices[0];
      console.log('OR choice0:', JSON.stringify(choice, null, 2)); // Debug log
      
      // 使用更健壯的圖片提取函式
      const dataUrl = pickImageDataUrl(choice);
      
      if (dataUrl) {
        console.log('DataURL prefix:', dataUrl.slice(0, 50));
        console.log('Found image data, uploading to Cloudinary...');
        
        const imageUrl = await uploadImageToCloudinary(dataUrl);
        if (imageUrl) {
          console.log('Upload URL:', imageUrl);
          return imageUrl;
        }
      }
      
      // 如果沒找到圖片，回傳原始內容供調試
      const content = choice.message.content;
      console.log('No image found, raw content:', typeof content === 'string' ? content.slice(0, 200) : content);
      return content;
    }
    return null;
  } catch (error) {
    console.error('Error generating image:', error.response?.data || error.message);
    return null;
  }
}

const userStates = new Map();

async function handleEvent(event) {
  if (event.type !== 'message') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  
  if (event.message.type === 'image') {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '收到圖片！請輸入您想要的修改或創作描述，我會基於這張圖片生成新的圖片。例如：「改成卡通風格」、「加上彩虹背景」等。'
    });
    
    userStates.set(userId, {
      imageId: event.message.id,
      timestamp: Date.now()
    });
    
    return Promise.resolve(null);
  }
  
  if (event.message.type === 'text') {
    const text = event.message.text;
    const userState = userStates.get(userId);
    
    if (userState && (Date.now() - userState.timestamp < 300000)) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '正在基於您的圖片和描述生成新圖片，請稍候...'
      });
      
      const imageBuffer = await getImageBuffer(userState.imageId);
      if (imageBuffer) {
        const result = await generateImageWithPrompt(imageBuffer, text);
        
        if (result) {
          userStates.delete(userId);
          // 檢查是否為圖片 URL
          if (result.startsWith('http') && /\.(jpg|jpeg|png|gif|webp)$/i.test(result)) {
            return client.pushMessage(userId, {
              type: 'image',
              originalContentUrl: result,
              previewImageUrl: result
            });
          } else {
            return client.pushMessage(userId, {
              type: 'text',
              text: `生成結果：\n${result}`
            });
          }
        } else {
          userStates.delete(userId);
          return client.pushMessage(userId, {
            type: 'text',
            text: '圖片生成失敗，請重新上傳圖片或稍後再試。'
          });
        }
      } else {
        userStates.delete(userId);
        return client.pushMessage(userId, {
          type: 'text',
          text: '無法獲取圖片，請重新上傳。'
        });
      }
    } else {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '使用方法：\n1. 傳送一張圖片\n2. 接著傳送文字描述您想要生成的新圖片\n\n範例：\n• 上傳風景照後，輸入「把這個場景改成夜晚」\n• 上傳人像照後，輸入「改成卡通風格」\n• 上傳物品照後，輸入「加上彩虹背景」'
      });
    }
  }
  
  return Promise.resolve(null);
}

app.post('/webhook', (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

app.get('/', (req, res) => {
  res.send('LINE Bot is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});