module.exports = {
  richMenu: {
    size: {
      width: 2500,
      height: 1686
    },
    selected: false,
    name: "Image Bot Menu",
    chatBarText: "圖片功能選單",
    areas: [
      {
        bounds: {
          x: 0,
          y: 0,
          width: 833,
          height: 843
        },
        action: {
          type: "message",
          text: "上傳圖片"
        }
      },
      {
        bounds: {
          x: 833,
          y: 0,
          width: 833,
          height: 843
        },
        action: {
          type: "message",
          text: "圖片風格轉換"
        }
      },
      {
        bounds: {
          x: 1666,
          y: 0,
          width: 834,
          height: 843
        },
        action: {
          type: "message",
          text: "圖片增強"
        }
      },
      {
        bounds: {
          x: 0,
          y: 843,
          width: 833,
          height: 843
        },
        action: {
          type: "message",
          text: "物件偵測"
        }
      },
      {
        bounds: {
          x: 833,
          y: 843,
          width: 833,
          height: 843
        },
        action: {
          type: "message",
          text: "文字辨識"
        }
      },
      {
        bounds: {
          x: 1666,
          y: 843,
          width: 834,
          height: 843
        },
        action: {
          type: "message",
          text: "說明"
        }
      }
    ]
  }
};