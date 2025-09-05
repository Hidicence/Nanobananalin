require('dotenv').config();
const { Client } = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
const menuConfig = require('./menuConfig');

// LINE Bot 配置
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

async function setupRichMenu() {
  try {
    console.log('開始設置 Rich Menu...');
    
    // 1. 創建 Rich Menu
    const richMenuId = await client.createRichMenu(menuConfig.richMenu);
    console.log('Rich Menu 創建成功，ID:', richMenuId);
    
    // 2. 上傳 Rich Menu 圖片
    // 你需要準備一張 2500x1686 的圖片
    const imagePath = path.join(__dirname, 'richmenu.png');
    
    if (fs.existsSync(imagePath)) {
      const imageBuffer = await fs.promises.readFile(imagePath);
      await client.setRichMenuImage(richMenuId, imageBuffer);
      console.log('Rich Menu 圖片上傳成功');
    } else {
      console.log('警告：未找到 richmenu.png 圖片文件，請手動上傳圖片');
      console.log('圖片規格：2500x1686 pixels，PNG 格式');
    }
    
    // 3. 設置為預設 Rich Menu
    await client.setDefaultRichMenu(richMenuId);
    console.log('Rich Menu 設置為預設菜單');
    
    console.log('Rich Menu 設置完成！');
  } catch (error) {
    console.error('設置 Rich Menu 時發生錯誤:', error);
  }
}

// 執行設置
if (require.main === module) {
  setupRichMenu();
}

module.exports = setupRichMenu;