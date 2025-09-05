const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateMenuImage() {
  // 創建 2500x1686 的畫布
  const canvas = createCanvas(2500, 1686);
  const ctx = canvas.getContext('2d');
  
  // 設置背景色
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 2500, 1686);
  
  // 繪製網格線
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  
  // 垂直線
  for (let i = 0; i <= 3; i++) {
    const x = i * 833;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1686);
    ctx.stroke();
  }
  
  // 水平線
  ctx.beginPath();
  ctx.moveTo(0, 843);
  ctx.lineTo(2500, 843);
  ctx.stroke();
  
  // 設置文字樣式
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 繪製按鈕文字
  const buttons = [
    { x: 416, y: 421, text: '上傳圖片' },
    { x: 1249, y: 421, text: '風格轉換' },
    { x: 2083, y: 421, text: '圖片增強' },
    { x: 416, y: 1264, text: '物件偵測' },
    { x: 1249, y: 1264, text: '文字辨識' },
    { x: 2083, y: 1264, text: '說明' }
  ];
  
  buttons.forEach(button => {
    // 繪製按鈕背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(button.x - 300, button.y - 100, 600, 200);
    
    // 繪製按鈕邊框
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 3;
    ctx.strokeRect(button.x - 300, button.y - 100, 600, 200);
    
    // 繪製文字
    ctx.fillStyle = '#333333';
    ctx.fillText(button.text, button.x, button.y);
  });
  
  // 保存圖片
  const buffer = canvas.toBuffer('image/png');
  const imagePath = path.join(__dirname, 'richmenu.png');
  fs.writeFileSync(imagePath, buffer);
  
  console.log('菜單圖片已生成：', imagePath);
  console.log('請將此圖片上傳到 LINE Developers 控制台');
}

// 執行生成
if (require.main === module) {
  try {
    generateMenuImage();
  } catch (error) {
    console.error('生成菜單圖片時發生錯誤：', error.message);
    console.log('請手動創建 2500x1686 的 PNG 圖片');
  }
}

module.exports = generateMenuImage;