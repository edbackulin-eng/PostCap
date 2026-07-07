require('dotenv').config();
const wayforpay = require('./src/services/wayforpay');

async function main() {
  const orderReference = `test-${Date.now()}`;
  console.log('Creating test invoice with orderReference:', orderReference);

  const result = await wayforpay.createInvoice({
    orderReference,
    items: [{ name: 'Капучино', price: 65, quantity: 1 }],
  });

  console.log('Response:', JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('WayForPay test failed:', err.message);
  process.exitCode = 1;
});
