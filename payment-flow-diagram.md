# ECPay 付款通知機制詳解

## 🔄 完整付款流程

### 步驟 1: 創建付款
```javascript
// 用戶點擊付費按鈕
用戶點擊 "付費 10 元" → 你的 LINE Bot 收到
↓
// 你的系統生成付款資料
const paymentData = {
  MerchantTradeNo: `ORDER_${userId}_${timestamp}`, // 訂單編號
  TotalAmount: 10,                                 // 金額
  TradeDesc: '圖片生成服務',
  ReturnURL: 'https://你的域名/ecpay/callback',    // 重點！
  ClientBackURL: 'https://line.me'                // 付完回到LINE
}
↓
// 跳轉到 ECPay 付款頁面
ECPay.aio_check_out_all(paymentData) → 產生付款 URL
↓
// 用戶看到付款頁面
用戶選擇付款方式 (信用卡/ATM/超商)
```

### 步驟 2: 付款完成通知 🎯 關鍵步驟
```
用戶付款成功 
    ↓
ECPay 伺服器自動發送 POST 請求到你的 ReturnURL
    ↓
POST https://你的域名/ecpay/callback
Content-Type: application/x-www-form-urlencoded

MerchantID=你的商店ID
MerchantTradeNo=ORDER_user123_1234567890
RtnCode=1          ← 1=成功, 其他=失敗  
RtnMsg=Succeeded   
TradeNo=ECPay的交易編號
TradeAmt=10
PaymentDate=2024/01/15 14:30:25
CheckMacValue=驗證碼
```

### 步驟 3: 你的系統處理
```javascript
// 你的 /ecpay/callback API 收到通知
app.post('/ecpay/callback', (req, res) => {
  const { MerchantTradeNo, RtnCode, TradeAmt } = req.body;
  
  // 1. 驗證是否為真實的 ECPay 通知
  if (verifyCallback(req.body)) {
    
    // 2. 檢查付款狀態
    if (RtnCode === '1') { // 付款成功
      
      // 3. 從訂單編號提取用戶ID
      const userId = MerchantTradeNo.split('_')[1]; // ORDER_user123_xxx → user123
      
      // 4. 給用戶加點數/開通權限
      addUserCredits(userId, 1); // 加1次使用權限
      
      // 5. 發送 LINE 通知給用戶
      client.pushMessage(userId, {
        type: 'text',
        text: '🎉 付款成功！您現在可以生成圖片了！'
      });
      
      console.log(`用戶 ${userId} 付款成功，已加點數`);
    }
  }
  
  // 6. 回應 ECPay (必須回應 '1|OK')
  res.send('1|OK');
});
```

## 🔒 安全驗證機制

### 防偽驗證
```javascript
function verifyCallback(data) {
  // ECPay 會用你的 HashKey + HashIV 產生 CheckMacValue
  // 你也用同樣方式計算，比對是否一致
  const calculatedMac = generateCheckMac(data);
  return calculatedMac === data.CheckMacValue;
}
```

### 重複付款防護
```javascript
const processedOrders = new Set();

if (processedOrders.has(MerchantTradeNo)) {
  console.log('重複的付款通知，忽略');
  return res.send('1|OK');
}
processedOrders.add(MerchantTradeNo);
```

## 📱 用戶端體驗

### 1. 付款中
```
用戶在 ECPay 付款頁面
↓
選擇信用卡付款
↓
輸入卡號、完成付款
↓
ECPay 顯示「付款成功」
↓
自動跳回 LINE (因為設定了 ClientBackURL)
```

### 2. 付款完成
```
用戶回到 LINE
↓
幾秒後收到 Bot 訊息: "🎉 付款成功！"
↓
用戶可立即使用服務
```

## ⚠️ 重要注意事項

### Webhook URL 設定
- 必須是 **HTTPS** (不能是 HTTP)
- 必須是**公開可訪問**的網址 (不能是 localhost)
- ECPay 會在 30 秒內嘗試呼叫，如果失敗會重試

### 網址範例
```
❌ 錯誤: http://localhost:3000/callback
❌ 錯誤: https://192.168.1.100/callback  
✅ 正確: https://your-bot.herokuapp.com/ecpay/callback
✅ 正確: https://abc123.ngrok.io/ecpay/callback
```

### 本地開發解決方案
```bash
# 使用 ngrok 建立公開網址
npm install -g ngrok
ngrok http 3000

# 會得到: https://abc123.ngrok.io
# 設定 callback: https://abc123.ngrok.io/ecpay/callback
```

## 🔄 完整時序圖

```
用戶          你的Bot        ECPay        你的Callback API
 |              |             |               |
 |--點付費----->|             |               |
 |              |--建立訂單--->|               |
 |              |<--付款URL----|               |
 |<--跳轉付款----|             |               |
 |              |             |               |
 |--完成付款------------------->|               |
 |              |             |--通知付款成功-->|
 |              |             |               |--加點數
 |              |<--LINE推播通知----------------|
 |<--付款成功----|             |               |
 |              |             |<--回應1|OK-----|
```

## 💡 關鍵優勢

1. **即時通知**: 付款完成幾秒內就知道
2. **自動化**: 完全不需要人工確認
3. **可靠性**: ECPay 會重試失敗的通知
4. **安全性**: 有加密驗證機制

這就是為什麼 ECPay 比轉帳付費好的原因 - 完全自動化！

想要我開始實際整合這個機制嗎？