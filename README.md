# LINE Bot 圖片分析器

使用 Google Gemini 2.5 Flash Vision 的 LINE Bot，讓用戶透過 LINE 上傳圖片並獲得 AI 分析。

## 功能

- 上傳圖片後傳送文字描述或問題來分析圖片
- 使用 Google Gemini 2.5 Flash Vision 模型
- 支援圖片內容識別、物體檢測、文字識別等功能

## 安裝與設置

### 1. 安裝依賴套件

```bash
npm install
```

### 2. 設定 LINE Bot

1. 到 [LINE Developers Console](https://developers.line.biz/console/) 創建新的 Channel
2. 複製 Channel Access Token 和 Channel Secret
3. 在 `.env` 檔案中填入你的 LINE Bot 資訊：

```env
LINE_CHANNEL_ACCESS_TOKEN=你的_LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=你的_LINE_CHANNEL_SECRET
```

### 3. 設定 Webhook URL

在 LINE Developers Console 中設定 Webhook URL：
```
https://你的伺服器網址/webhook
```

## 啟動服務

```bash
npm start
```

伺服器將在 port 3000 運行。

## 使用方法

在 LINE 中與你的 bot 對話：

1. **上傳圖片**：直接在聊天室中傳送一張圖片
2. **傳送文字**：接著傳送你想問的問題或描述

### 範例

```
步驟 1：上傳食物照片
步驟 2：傳送文字：「這是什麼料理？」

步驟 1：上傳文件照片
步驟 2：傳送文字：「幫我翻譯這些文字」

步驟 1：上傳景物照片
步驟 2：傳送文字：「描述這個場景」
```

## 檔案結構

```
├── index.js          # 主要應用程式檔案
├── .env              # 環境變數配置
├── package.json      # NPM 配置檔案
└── README.md         # 說明文件
```

## 環境變數

- `LINE_CHANNEL_ACCESS_TOKEN`: LINE Bot 的 Access Token
- `LINE_CHANNEL_SECRET`: LINE Bot 的 Channel Secret
- `OPENROUTER_API_KEY`: OpenRouter AI 的 API Key（已預設）
- `PORT`: 伺服器端口（預設 3000）

## 注意事項

- 圖片分析可能需要一些時間，請耐心等待
- 支援常見圖片格式（JPG, PNG 等）
- 請確保網路連線穩定
- 使用詳細的問題或描述可以獲得更精確的分析結果
- 圖片和文字訊息必須在 5 分鐘內連續傳送，超時後需要重新上傳圖片