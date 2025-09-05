const promptMapping = require('./promptMapping');

console.log('测试 promptMapping.js 配置...\n');

// 测试菜单选项
const menuOptions = ['圖片變模型', '樂高玩具', '針織玩偶', '專業履歷照', '日系寫真', '1970年'];

console.log('测试菜单关键字到 Prompt 的映射:');
menuOptions.forEach(option => {
  const prompt = promptMapping.prompts[option];
  if (prompt) {
    console.log(`✓ "${option}" -> ${prompt.substring(0, 50)}...`);
  } else {
    console.log(`✗ "${option}" -> 未找到对应的 Prompt`);
  }
});

console.log('\n所有可用的 Prompt 映射:');
Object.keys(promptMapping.prompts).forEach(key => {
  console.log(`"${key}" -> ${promptMapping.prompts[key].substring(0, 50)}...`);
});

console.log('\n所有可用的区域:');
Object.entries(promptMapping.areas).forEach(([area, functionName]) => {
  console.log(`"${area}" -> ${functionName}`);
});

console.log('\n测试通过区域获取 Prompt:');
const areaKeys = ['A', 'B', 'C', 'D', 'E', 'F'];
areaKeys.forEach(area => {
  const functionName = promptMapping.areas[area];
  const prompt = promptMapping.getPromptByArea(area);
  if (functionName && prompt) {
    console.log(`✓ 区域 ${area} -> ${functionName} -> ${prompt.substring(0, 50)}...`);
  } else {
    console.log(`✗ 区域 ${area} -> ${functionName || '未找到'} -> 获取 Prompt 失败`);
  }
});

console.log('\n测试完成 ===');