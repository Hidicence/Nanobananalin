# LINE Pay 付費功能設定指南

## 目前狀態
✅ **付費架構已完成**  
✅ **基本功能正常運作**  
⚠️ **需要 LINE Pay 商家設定**

## 如何啟用付費功能

### 1. 申請 LINE Pay 商家帳號
1. 前往 [LINE Pay 商家中心](https://pay.line.me/tw/merchants/signup)
2. 填寫申請資料（需要營業登記相關文件）
3. 等待審核通過（通常需要 3-7 個工作天）

### 2. 獲取 API 金鑰
審核通過後，從 LINE Pay 商家後台獲取：
- `Channel ID` (頻道 ID)
- `Channel Secret` (頻道密鑰)

### 3. 更新環境變數
在 `.env` 文件中更新以下設定：
```env
# LINE Pay Configuration
LINE_PAY_CHANNEL_ID=你的_LINE_PAY_CHANNEL_ID
LINE_PAY_CHANNEL_SECRET=你的_LINE_PAY_CHANNEL_SECRET
```

### 4. 設定 Webhook URL
在 LINE Pay 商家後台設定：
- **Confirm URL**: `https://你的域名/pay/confirm`
- **Cancel URL**: `https://你的域名/pay/cancel` (可選)

## 現有付費機制說明

### 免費額度
- **每日免費**: 1 次圖片生成
- **付費價格**: 10 元台幣/次

### 付費流程
1. 用戶超過免費額度時會看到付費提示
2. 點擊「支付並生成圖片」按鈕
3. 跳轉到 LINE Pay 付費頁面
4. 完成付費後自動返回，可繼續生成圖片

### 用戶體驗
- 🔥 **即時付費**：付費完成立即可用
- 💫 **一次付費一次使用**：每次付費獲得一次生成機會
- 📱 **無縫整合**：在 LINE 內完成整個流程

## 測試功能

### 沙盒模式測試
```bash
# 運行測試腳本
npm run test-payment
# 或
node testLinePay.js
```

### 生產環境設定
修改 `index.js` 中的設定：
```javascript
const pay = new LinePay({
  channelId: process.env.LINE_PAY_CHANNEL_ID,
  channelSecret: process.env.LINE_PAY_CHANNEL_SECRET,
  isSandbox: false  // 改為 false 使用正式環境
});
```

## 疑難排解

### 常見錯誤

1. **付費按鈕沒反應**
   - 檢查環境變數是否正確設定
   - 確認 LINE Pay 設定不是預設值

2. **付費頁面無法開啟**
   - 確認 Channel ID 和 Secret 正確
   - 檢查網路連線
   - 確認是否使用正確的沙盒/正式環境

3. **付費完成但系統沒反應**
   - 檢查 Webhook URL 是否正確設定
   - 查看伺服器 log 是否有錯誤
   - 確認 `/pay/confirm` 路由正常運作

### 調試工具
- 查看伺服器 console log
- 檢查 LINE Pay 商家後台的交易記錄
- 使用瀏覽器開發者工具檢查網路請求

## 部署注意事項

### 正式環境檢查清單
- [ ] 環境變數正確設定
- [ ] `isSandbox: false`
- [ ] HTTPS 域名設定
- [ ] Webhook URL 正確配置
- [ ] 防火牆允許 LINE Pay 服務器連線

### 安全建議
- 定期更新 API 金鑰
- 監控異常交易
- 記錄付費日誌
- 實施率限制防止濫用

## 未來優化方向

1. **套餐制**：推出包月/包年方案
2. **優惠券系統**：新用戶優惠、推薦獎勵
3. **使用統計**：詳細的使用記錄和分析
4. **會員等級**：根據使用量提供不同權益

---

**需要幫助？**  
如果在設定過程中遇到問題，請檢查：
1. LINE Pay 商家申請狀態
2. API 金鑰是否正確
3. 網域設定是否完整
4. 環境變數是否正確載入

設定完成後，您的 LINE Bot 就具備完整的付費功能了！ 🚀