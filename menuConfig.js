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
          type: "postback",
          data: "area_A",
          label: "圖片變手辦"
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
          type: "postback",
          data: "area_B",
          label: "圖片轉樂高"
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
          type: "postback",
          data: "area_C",
          label: "圖片轉針織玩偶"
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
          type: "postback",
          data: "area_D",
          label: "人物形象與棚拍照"
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
          type: "postback",
          data: "area_E",
          label: "日系寫真"
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
          type: "postback",
          data: "area_F",
          label: "1970台灣"
        }
      }
    ]
  }
};