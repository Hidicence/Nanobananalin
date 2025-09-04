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

async function analyzeImageWithText(imageBuffer, text) {
  try {
    const base64Image = imageBuffer.toString('base64');
    const content = [];
    
    if (text && text.trim()) {
      content.push({
        type: 'text',
        text: text
      });
    }
    
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`
      }
    });

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'google/gemini-2.5-flash-vision',
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
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'LINE Bot Image Analyzer'
      }
    });

    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      return response.data.choices[0].message.content;
    }
    return null;
  } catch (error) {
    console.error('Error analyzing image:', error.response?.data || error.message);
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
      text: '收到圖片！請輸入您想要了解關於這張圖片的問題或描述，或直接傳送文字來分析圖片內容。'
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
        text: '正在分析圖片，請稍候...'
      });
      
      const imageBuffer = await getImageBuffer(userState.imageId);
      if (imageBuffer) {
        const analysis = await analyzeImageWithText(imageBuffer, text);
        
        if (analysis) {
          userStates.delete(userId);
          return client.pushMessage(userId, {
            type: 'text',
            text: analysis
          });
        } else {
          userStates.delete(userId);
          return client.pushMessage(userId, {
            type: 'text',
            text: '分析失敗，請重新上傳圖片或稍後再試。'
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
        text: '使用方法：\n1. 傳送一張圖片\n2. 接著傳送文字描述您想了解的內容\n\n範例：上傳一張食物照片後，輸入「這是什麼料理？」或「分析這道菜的營養成分」'
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