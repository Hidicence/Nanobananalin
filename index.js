require('dotenv').config();
const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');
const FormData = require('form-data');
const promptMapping = require('./promptMapping');

const app = express();
const PORT = process.env.PORT || 3000;

// Debug: 檢查環境變數
console.log('Environment variables loaded:');
console.log('LINE_CHANNEL_ACCESS_TOKEN:', process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'EXISTS' : 'MISSING');
console.log('LINE_CHANNEL_SECRET:', process.env.LINE_CHANNEL_SECRET ? 'EXISTS' : 'MISSING');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'EXISTS' : 'MISSING');

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

// 健強的圖片提取函式，兼容多種格式
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

// 添加圖像上傳函數 - 使用 ImgBB
async function uploadImageToImgBB(buffer) {
  try {
    const formData = new FormData();
    formData.append('image', buffer.toString('base64'));
    formData.append('key', process.env.IMGBB_API_KEY);
    
    const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    if (response.data && response.data.data && response.data.data.url) {
      console.log('Image uploaded to ImgBB:', response.data.data.url);
      return response.data.data.url;
    }
  } catch (error) {
    console.error('Error uploading to ImgBB:', error.response?.data || error.message);
  }
  return null;
}

// 移除 Imgur 相关函数
/*
async function uploadImageToImgur(buffer) {
  try {
    // 注意：這需要一個 Imgur 客戶端 ID
    // 你需要在 .env 文件中設置 IMGUR_CLIENT_ID
    const formData = new FormData();
    formData.append('image', buffer.toString('base64'));
    
    const response = await axios.post('https://api.imgur.com/3/image', formData, {
      headers: {
        'Authorization': `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
        ...formData.getHeaders()
      }
    });
    
    if (response.data && response.data.data && response.data.data.link) {
      return response.data.data.link;
    }
  } catch (error) {
    console.error('Error uploading to Imgur:', error.message);
  }
  return null;
}
*/

// 添加本地臨時存儲函數（僅用於測試）
async function saveImageLocally(buffer, filename) {
  try {
    // 在 Render 上這不會工作，僅用於本地測試
    const fs = require('fs').promises;
    const path = require('path');
    
    const imagePath = path.join(__dirname, 'temp', filename);
    await fs.writeFile(imagePath, buffer);
    
    // 返回本地路徑（在實際部署中這不會工作）
    return `https://your-render-url/temp/${filename}`;
  } catch (error) {
    console.error('Error saving image locally:', error.message);
  }
  return null;
}

// 將 base64 圖片數據直接轉換為 LINE 可用的格式
function convertBase64ToLineImage(base64Data) {
  try {
    // 移除 data URL 前綴（如果有的話）
    let cleanBase64 = base64Data;
    if (base64Data.startsWith('data:image')) {
      cleanBase64 = base64Data.split(',')[1];
    }
    
    // LINE 支持直接發送 base64 圖片
    return `data:image/png;base64,${cleanBase64}`;
  } catch (error) {
    console.error('Error converting base64 to LINE image:', error);
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
      
      // 使用更健強的圖片提取函式
      const dataUrl = pickImageDataUrl(choice);
      
      if (dataUrl) {
        console.log('DataURL prefix:', dataUrl.slice(0, 50));
        console.log('Found image data, processing for LINE...');
        
        // 解析 base64 數據
        const base64 = dataUrl.split(',')[1];
        const imageBuffer = Buffer.from(base64, 'base64');
        
        // 這裡我們需要上傳到一個公開可訪問的存儲服務
        // 暫時返回 base64 數據，稍後我們會實現上傳功能
        return { type: 'buffer', data: imageBuffer };
      }
      
      // 如果沒找到圖片，回傳原始內容供調試
      const content = choice.message.content;
      console.log('No image found, raw content:', typeof content === 'string' ? content.slice(0, 200) : content);
      return { type: 'text', data: content };
    }
    return null;
  } catch (error) {
    console.error('Error generating image:', error.response?.data || error.message);
    return null;
  }
}

const userStates = new Map();

// 添加處理 Postback 事件的函數
async function handlePostbackEvent(event) {
  const userId = event.source.userId;
  const data = event.postback.data;
  
  // 處理區域按鈕點擊
  if (data.startsWith('area_')) {
    const area = data.split('_')[1]; // 提取區域標識 (A, B, C, D, E, F)
    const functionName = promptMapping.areas[area];
    const prompt = promptMapping.prompts[functionName];
    
    if (functionName && prompt) {
      // 保存用戶狀態，標記選擇的功能
      userStates.set(userId, {
        selectedFunction: functionName,
        prompt: prompt,
        timestamp: Date.now()
      });
      
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `您選擇了「${functionName}」功能。\n請上傳一張圖片，我會根據您的選擇進行處理。`
      });
    }
  }
  
  // 處理原有菜單選項
  switch (data) {
    case 'upload_image':
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '請上傳一張圖片，我會為您處理。'
      });
      
    case 'style_transfer':
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '請先上傳一張圖片，然後告訴我您想要的風格（例如：卡通風格、油畫風格、黑白風格等）。'
      });
      
    case 'image_enhance':
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '請上傳一張圖片，我會幫您增強圖片品質。'
      });
      
    case 'object_detection':
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '請上傳一張圖片，我會幫您偵測圖片中的物件。'
      });
      
    case 'ocr':
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '請上傳一張包含文字的圖片，我會幫您辨識圖片中的文字。'
      });
      
    case 'help':
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '歡迎使用圖片處理機器人！\n\n' +
              '使用方法：\n' +
              '1. 點擊菜單中的功能按鈕\n' +
              '2. 上傳圖片\n' +
              '3. 等待處理結果\n\n' +
              '支援的功能：\n' +
              '• 圖片變模型\n' +
              '• 樂高玩具\n' +
              '• 針織玩偶\n' +
              '• 專業履歷照\n' +
              '• 日系寫真\n' +
              '• 1970年風格'
      });
  }
  
  return Promise.resolve(null);
}

async function handleEvent(event) {
  if (event.type !== 'message') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  
  // 處理菜單選項（用戶點擊菜單後自動發送的消息）
  if (event.message.type === 'text') {
    const text = event.message.text;
    
    // 檢查是否為菜單關鍵字
    const menuKeywords = ['圖片變模型', '樂高玩具', '針織玩偶', '專業履歷照', '日系寫真', '1970年'];
    if (menuKeywords.includes(text)) {
      // 根據關鍵字獲取對應的 Prompt
      const prompt = promptMapping.prompts[text];
      if (prompt) {
        // 保存用戶狀態，標記選擇的功能
        userStates.set(userId, {
          selectedFunction: text,
          prompt: prompt,
          timestamp: Date.now()
        });
        
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: `您選擇了「${text}」功能。\n請上傳一張圖片，我會根據您的選擇進行處理。`
        });
      }
    }
    
    // 根據菜單選項執行相應操作（原有邏輯）
    switch (text) {
      case '上傳圖片':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '請上傳一張圖片，我會為您處理。'
        });
        
      case '圖片風格轉換':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '請先上傳一張圖片，然後告訴我您想要的風格（例如：卡通風格、油畫風格、黑白風格等）。'
        });
        
      case '圖片增強':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '請上傳一張圖片，我會幫您增強圖片品質。'
        });
        
      case '物件偵測':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '請上傳一張圖片，我會幫您偵測圖片中的物件。'
        });
        
      case '文字辨識':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '請上傳一張包含文字的圖片，我會幫您辨識圖片中的文字。'
        });
        
      case '說明':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '歡迎使用圖片處理機器人！\n\n' +
                '使用方法：\n' +
                '1. 點擊「上傳圖片」或直接傳送圖片\n' +
                '2. 選擇您想要的功能\n' +
                '3. 輸入相關描述或指令\n\n' +
                '支援的功能：\n' +
                '• 圖片風格轉換\n' +
                '• 圖片增強\n' +
                '• 物件偵測\n' +
                '• 文字辨識'
        });
        
      case '選單':
        // 發送帶有 Quick Reply 的消息
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '請選擇您想要的功能：',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '上傳圖片',
                  text: '上傳圖片'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '風格轉換',
                  text: '圖片風格轉換'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '圖片增強',
                  text: '圖片增強'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '物件偵測',
                  text: '物件偵測'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '文字辨識',
                  text: '文字辨識'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '說明',
                  text: '說明'
                }
              }
            ]
          }
        });
    }
  }
  
  if (event.message.type === 'image') {
    const userState = userStates.get(userId);
    
    // 檢查用戶是否已選擇功能（通過菜單關鍵字）
    if (userState && userState.selectedFunction && userState.prompt) {
      // 用戶已通過菜單關鍵字選擇功能
      const selectedFunction = userState.selectedFunction;
      const prompt = userState.prompt;
      
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `正在處理圖片，使用「${selectedFunction}」功能...\n請稍候...`
      });
      
      // 清除用戶狀態
      userStates.delete(userId);
      
      // 處理圖片
      const imageBuffer = await getImageBuffer(event.message.id);
      if (imageBuffer) {
        const result = await generateImageWithPrompt(imageBuffer, prompt);
        
        if (result) {
          // 根據返回的數據類型處理
          if (result.type === 'url') {
            // URL 格式的圖片
            return client.pushMessage(userId, {
              type: 'image',
              originalContentUrl: result.data,
              previewImageUrl: result.data
            });
          } else if (result.type === 'buffer') {
            // 圖像緩衝區 - 需要上傳到公開存儲
            // 使用 ImgBB（需要 IMGBB_API_KEY）
            if (process.env.IMGBB_API_KEY) {
              const imageUrl = await uploadImageToImgBB(result.data);
              if (imageUrl) {
                return client.pushMessage(userId, {
                  type: 'image',
                  originalContentUrl: imageUrl,
                  previewImageUrl: imageUrl
                });
              }
            }
            
            // 如果 ImgBB 上傳失敗或沒有配置，返回錯誤消息
            return client.pushMessage(userId, {
              type: 'text',
              text: '圖片生成完成，但無法上傳到公開存儲服務。請聯繫管理員配置圖像存儲服務。'
            });
          } else if (result.type === 'text') {
            // 文本格式的結果
            return client.pushMessage(userId, {
              type: 'text',
              text: `生成結果：\n${result.data}`
            });
          } else {
            // 默認處理
            return client.pushMessage(userId, {
              type: 'text',
              text: typeof result === 'string' ? result : '圖片生成完成'
            });
          }
        } else {
          return client.pushMessage(userId, {
            type: 'text',
            text: '圖片生成失敗，請重新上傳圖片或稍後再試。'
          });
        }
      } else {
        return client.pushMessage(userId, {
          type: 'text',
          text: '無法獲取圖片，請重新上傳。'
        });
      }
    } else {
      // 用戶未通過菜單選擇功能，顯示提示
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '收到圖片！請在接下來的三分鐘內  自行輸入你想轉換的指令  或是透過選單選擇你想轉換的風格'
      });
      
      userStates.set(userId, {
        imageId: event.message.id,
        timestamp: Date.now()
      });
    }
    
    return Promise.resolve(null);
  }
  
  // 處理文字消息（用戶未通過菜單選擇功能時）
  if (event.message.type === 'text') {
    const text = event.message.text;
    const userState = userStates.get(userId);
    
    if (userState && userState.imageId && (Date.now() - userState.timestamp < 180000)) { // 3分鐘 = 180000毫秒
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '正在基於您的圖片和描述生成新圖片，請稍候...'
      });
      
      const imageBuffer = await getImageBuffer(userState.imageId);
      if (imageBuffer) {
        const result = await generateImageWithPrompt(imageBuffer, text);
        
        if (result) {
          userStates.delete(userId);
          
          // 根據返回的數據類型處理
          if (result.type === 'url') {
            // URL 格式的圖片
            return client.pushMessage(userId, {
              type: 'image',
              originalContentUrl: result.data,
              previewImageUrl: result.data
            });
          } else if (result.type === 'buffer') {
            // 圖像緩衝區 - 需要上傳到公開存儲
            // 使用 ImgBB（需要 IMGBB_API_KEY）
            if (process.env.IMGBB_API_KEY) {
              const imageUrl = await uploadImageToImgBB(result.data);
              if (imageUrl) {
                return client.pushMessage(userId, {
                  type: 'image',
                  originalContentUrl: imageUrl,
                  previewImageUrl: imageUrl
                });
              }
            }
            
            // 如果 ImgBB 上傳失敗或沒有配置，返回錯誤消息
            return client.pushMessage(userId, {
              type: 'text',
              text: '圖片生成完成，但無法上傳到公開存儲服務。請聯繫管理員配置圖像存儲服務。'
            });
          } else if (result.type === 'text') {
            // 文本格式的結果
            return client.pushMessage(userId, {
              type: 'text',
              text: `生成結果：\n${result.data}`
            });
          } else {
            // 默認處理
            return client.pushMessage(userId, {
              type: 'text',
              text: typeof result === 'string' ? result : '圖片生成完成'
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
      // 如果用戶沒有上傳圖片或者超時，則按照原有菜單邏輯處理
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