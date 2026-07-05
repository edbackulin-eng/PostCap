require('dotenv').config();
const checkbox = require('./src/services/checkbox');

async function main() {
  console.log('Step 1: Authenticating...');
  const token = await checkbox.authenticate();
  console.log('Access token received:', token);

  console.log('Step 2: Opening shift...');
  const shiftResult = await checkbox.openShift(token);
  console.log('Shift open result: status =', shiftResult.status, ', id =', shiftResult.id);

  console.log('Waiting for shift to become OPENED...');
  let shift = shiftResult;
  for (let i = 0; i < 10 && shift.status !== 'OPENED'; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    shift = await checkbox.getShiftStatus(token, shiftResult.id);
    console.log('  shift status:', shift.status);
  }

  console.log('Step 3: Creating test receipt...');
  const receipt = await checkbox.createReceipt(
    token,
    [{ code: '1', name: 'Капучино', price: 65, quantity: 1 }],
    'cash',
    65
  );
  console.log('Receipt result:', JSON.stringify(receipt, null, 2));
}

main().catch((err) => {
  console.error('Checkbox test failed:', err.message);
  process.exitCode = 1;
});
