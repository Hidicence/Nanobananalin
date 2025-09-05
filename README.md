# LINE Bot 圖片處理器

使用 Google Gemini 2.5 Flash Vision 的 LINE Bot，讓用戶透過 LINE 上傳圖片並獲得 AI 圖片處理與分析。

## 功能特色

- **AI 圖片生成**：基於用戶上傳的圖片和描述，生成新的圖片
- **預設圖片處理功能**：
  - 圖片變手辦
  - 圖片轉樂高
  - 圖片轉針織玩偶
  - 人物形象與棚拍照
  - 日系寫真
  - 1970台灣風格
- **自定義圖片處理功能**：
  - 圖片風格轉換（卡通風格、油畫風格等）
  - 圖片增強與優化
  - 物件偵測與標記
  - 文字辨識與翻譯
- **直觀的用戶界面**：
  - Rich Menu 圖形化菜單
  - Quick Reply 快速回覆按鈕
- **付費功能**：
  - 每天免費生成一張圖片
  - 超出免費額度後可通過 LINE Pay 支付繼續生成

## 技術架構

- **後端語言**：Node.js + Express
- **AI 模型**：Google Gemini 2.5 Flash Vision（通過 OpenRouter API 調用）
- **圖片存儲**：ImgBB 圖片托管服務
- **支付系統**：LINE Pay
- **LINE 整合**：LINE Messaging API SDK

## 安裝與設置

### 1. 安裝依賴套件

```bash
npm install
```

### 2. 設定環境變數

在 `.env` 檔案中填入必要的配置資訊：

```env
# LINE Bot 配置
LINE_CHANNEL_ACCESS_TOKEN=你的_LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=你的_LINE_CHANNEL_SECRET

# OpenRouter AI 配置
OPENROUTER_API_KEY=你的_OPENROUTER_API_KEY

# ImgBB 圖片存儲配置
IMGBB_API_KEY=你的_IMGBB_API_KEY

# LINE Pay 配置（可選）
LINE_PAY_CHANNEL_ID=你的_LINE_PAY_CHANNEL_ID
LINE_PAY_CHANNEL_SECRET=你的_LINE_PAY_CHANNEL_SECRET

# 伺服器配置
PORT=10000
```

### 3. 設定 LINE Bot

1. 到 [LINE Developers Console](https://developers.line.biz/console/) 創建新的 Messaging API Channel
2. 複製 Channel Access Token 和 Channel Secret
3. 在 LINE Developers Console 中設定 Webhook URL：
```
https://你的伺服器網址/webhook
```

### 4. 設置 Rich Menu（可選但推薦）

1. 登錄 LINE Developers 控制台
2. 創建 Rich Menu 並配置以下區域：
   - A: 圖片變手辦
   - B: 圖片轉樂高
   - C: 圖片轉針織玩偶
   - D: 人物形象與棚拍照
   - E: 日系寫真
   - F: 1970台灣風格
3. 上傳菜單圖片（使用你提供的 richmenu-template-guide-01.png）

## 啟動服務

### 本地開發
```bash
npm run dev
```

### 生產環境
```bash
npm start
```

伺服器將在指定端口運行（預設 10000）。

## 使用方法

### 通過菜單使用（推薦）
1. 在 LINE 中與你的 bot 對話
2. 點擊 Rich Menu 中的功能按鈕（A-F 區域）
3. 上傳圖片
4. 等待處理結果

### 直接使用
1. **上傳圖片**：直接在聊天室中傳送一張圖片
2. **選擇功能**：根據提示選擇想要的操作
3. **輸入描述**：輸入具體的處理要求

### 付費功能
- 每個用戶每天可以免費生成一張圖片
- 當免費額度用完後，系統會提示用戶通過 LINE Pay 支付 10 元繼續生成圖片
- 支付成功後可立即繼續使用圖片生成功能

### 功能詳情

#### 預設圖片處理功能
```
A. 圖片變手辦：將圖片主體轉換為1/7比例的PVC公仔
B. 圖片轉樂高：將人物轉換為樂高積木風格
C. 圖片轉針織玩偶：將圖片轉換為針織玩偶風格
D. 人物形象與棚拍照：生成專業棚拍形象照
E. 日系寫真：生成日系清新風格寫真
F. 1970台灣：將人物轉換為1970年代台灣風格
```

#### 自定義圖片處理功能
```
圖片風格轉換：
上傳圖片 → 輸入風格描述 → 生成新風格圖片
範例描述：「改成卡通風格」、「轉為油畫效果」、「黑白處理」

圖片增強：
上傳圖片 → 輸入「增強」 → 獲得優化後的圖片

物件偵測：
上傳圖片 → 輸入「偵測」 → 獲得圖片中物件的標記與分析

文字辨識：
上傳包含文字的圖片 → 輸入「辨識」 → 獲得圖片中文字的識別結果
```

## 檔案結構

```
├── index.js              # 主要應用程式檔案
├── promptMapping.js      # 菜單按鈕到 Prompt 的映射配置
├── menuConfig.js         # Rich Menu 配置
├── setupRichMenu.js      # Rich Menu 設置腳本
├── generateMenuImage.js  # 菜單圖片生成腳本
├── .env                  # 環境變數配置
├── package.json          # NPM 配置檔案
└── README.md             # 說明文件
```

## 環境變數說明

- `LINE_CHANNEL_ACCESS_TOKEN`: LINE Bot 的 Access Token
- `LINE_CHANNEL_SECRET`: LINE Bot 的 Channel Secret
- `OPENROUTER_API_KEY`: OpenRouter AI 的 API Key
- `IMGBB_API_KEY`: ImgBB 圖片托管服務的 API Key
- `LINE_PAY_CHANNEL_ID`: LINE Pay 的 Channel ID（可選）
- `LINE_PAY_CHANNEL_SECRET`: LINE Pay 的 Channel Secret（可選）
- `PORT`: 伺服器端口（預設 10000）

## 部署到 Render

1. 連接你的 GitHub 倉庫
2. 設置環境變數
3. 配置 Build Command: `npm install`
4. 配置 Start Command: `npm start`

## 注意事項

- 圖片處理可能需要一些時間，請耐心等待
- 支援常見圖片格式（JPG, PNG 等）
- 請確保網路連線穩定
- 生成的圖片會自動上傳到 ImgBB 並通過 LINE 發送
- 圖片和文字訊息必須在 5 分鐘內連續傳送，超時後需要重新上傳圖片
- ImgBB 有免費使用額度限制，請注意使用量
- LINE Pay 功能需要在 LINE Developers Console 中配置相應的支付渠道

## 故障排除

### 常見問題

1. **圖片無法發送**：
   - 檢查 ImgBB API Key 是否正確配置
   - 確認圖片大小不超過 LINE 限制（10MB）

2. **AI 回應緩慢**：
   - 可能是 OpenRouter 服務繁忙，請稍後重試

3. **菜單無法顯示**：
   - 確認 Rich Menu 已正確設置並設為預設菜單

4. **支付功能無法使用**：
   - 確認 LINE Pay 的 Channel ID 和 Secret 已正確配置
   - 檢查是否已完成 LINE Pay 的商戶申請流程

### 支援與反饋

如有問題或建議，請通過 GitHub Issues 提交反饋。