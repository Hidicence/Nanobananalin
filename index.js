require('dotenv').config();
const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

app.use(middleware(config));

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

async function generateImageWithPrompt(imageBuffer, text) {
  try {
    const base64Image = imageBuffer.toString('base64');
    const content = [];
    
    // 構建圖片生成的 prompt
    const prompt = text && text.trim() 
      ? `Based on the uploaded image, generate a new image with these modifications: ${text}`
      : `Generate a new creative image inspired by the uploaded image`;
    
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
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: 1024,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://line-bot-gemini-hngc.onrender.com',
        'X-Title': 'LINE Bot Image Generator'
      }
    });

    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const content = response.data.choices[0].message.content;
      // 嘗試提取圖片 URL
      const imageUrlMatch = content.match(/https?:\/\/[^\s\)]+\.(jpg|jpeg|png|gif|webp)/i);
      return imageUrlMatch ? imageUrlMatch[0] : content;
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