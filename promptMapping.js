// 菜单按钮到 Prompt 的映射配置
// 根据 richmenu-template-guide 的区域划分：
// A (区域1): 图片变模型
// B (区域2): 乐高玩具
// C (区域3): 针织玩偶
// D (区域4): 专业履历照
// E (区域5): 日系写真
// F (区域6): 1970年

module.exports = {
  // 区域映射（注意：这里应该是菜单关键字，与 prompts 中的键名一致）
  areas: {
    'A': '圖片變模型',
    'B': '樂高玩具',
    'C': '針織玩偶',
    'D': '專業履歷照',
    'E': '日系寫真',
    'F': '1970年'
  },
  
  // 对应的 Prompt（键名与菜单关键字一致）
  prompts: {
    '圖片變模型': `生成高畫質場景：將圖片主體轉換為一個1/7比例的PVC公仔，站在透明圓形底座上，擺放於蘋果電腦桌前。螢幕顯示該角色的3D線框專業系統設計圖。公仔造型真實、清晰。桌上有鍵盤、滑鼠，以及同款日系風格的商品包裝盒`,
    
    '樂高玩具': `Transform the person in the photo into the style of a LEGO minifigure packaging box, presented in an isometric perspective. Label the packaging with the title 'ZHOGUE'. Inside the box, showcase the LEGO minifigure based on the person in the photo, accompanied by their essential items (such as cosmetics, bags, or others) as LEGO accessories. Next to the box, also display the actual LEGO minifigure itself outside of the packaging, rendered in a realistic and lifelike style.`,
    
    '針織玩偶': `A close-up, professionally composed photograph showing a handmade crocheted yarn doll being gently held in both hands. The doll has a rounded shape and an adorable chibi-style appearance, with vivid color contrasts and rich details. The hands holding the doll appear natural and tender, with clearly visible finger posture, and the skin texture and light-shadow transitions look soft and realistic, conveying a warm, tangible touch. The background is slightly blurred, depicting an indoor setting with a warm wooden tabletop and natural light streaming in through a window, creating a cozy and intimate atmosphere. The overall image conveys a sense of exquisite craftsmanship and a cherished, heartwarming emotion.`,
    
    '專業履歷照': `生成專業棚拍形象照，穿著黑色西裝，深色背景，適合放在履歷的照片`,
    
    '日系寫真': `將畫面中的人物做一張日系清新風格，隨機拍攝角度，可為全身或半身構圖。如專業攝影師拍攝的日系寫真作品。`,
    
    '1970年': `Reimagine the person in this photo in the style of Taiwan in the 1970s. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that decade. The output must be a photorealistic image showing the person clearly.`
  },
  
  // 获取区域对应的 Prompt
  getPromptByArea: function(area) {
    const areaName = this.areas[area];
    if (areaName && this.prompts[areaName]) {
      return this.prompts[areaName];
    }
    return null;
  },
  
  // 获取所有区域信息
  getAllAreas: function() {
    return Object.keys(this.areas);
  },
  
  // 获取所有功能名称
  getAllFunctions: function() {
    return Object.values(this.areas);
  }
};