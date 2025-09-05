require('dotenv').config();
const LinePay = require('line-pay');

// 初始化 LINE Pay
const pay = new LinePay({
  channelId: process.env.LINE_PAY_CHANNEL_ID || 'test_channel_id',
  channelSecret: process.env.LINE_PAY_CHANNEL_SECRET || 'test_channel_secret',
  isSandbox: true // 使用沙盒环境进行测试
});

console.log('LINE Pay 集成测试');

// 测试创建支付请求
async function testCreatePayment() {
  try {
    console.log('正在创建支付请求...');
    
    // 模拟创建支付请求
    const reservation = await pay.reserve({
      productName: '測試商品',
      amount: 10,
      currency: 'TWD',
      confirmUrl: 'https://example.com/pay/confirm',
      orderId: 'test_order_' + Date.now()
    });
    
    console.log('支付请求创建成功:');
    console.log('- 预定ID:', reservation.info.reservationId);
    console.log('- 支付URL:', reservation.info.paymentUrl.web);
    
    return reservation.info;
  } catch (error) {
    console.error('创建支付请求失败:', error.message);
    return null;
  }
}

// 运行测试
testCreatePayment().then(() => {
  console.log('测试完成');
});