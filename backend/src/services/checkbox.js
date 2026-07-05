const BASE_URL = 'https://api.checkbox.ua/api/v1';

async function authenticate() {
  const response = await fetch(`${BASE_URL}/cashier/signinPinCode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-License-Key': process.env.CHECKBOX_LICENSE_KEY,
    },
    body: JSON.stringify({ pin_code: process.env.CHECKBOX_PIN_CODE }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Checkbox authenticate failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function findOpenShift(token) {
  const response = await fetch(`${BASE_URL}/shifts?status=CREATED,OPENED`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-License-Key': process.env.CHECKBOX_LICENSE_KEY,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Checkbox findOpenShift failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data.results[0] ?? null;
}

async function openShift(token) {
  const existingShift = await findOpenShift(token);
  if (existingShift) {
    return existingShift;
  }

  const response = await fetch(`${BASE_URL}/shifts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-License-Key': process.env.CHECKBOX_LICENSE_KEY,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Checkbox openShift failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

async function getShiftStatus(token, shiftId) {
  const response = await fetch(`${BASE_URL}/shifts/${shiftId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-License-Key': process.env.CHECKBOX_LICENSE_KEY,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Checkbox getShiftStatus failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

async function createReceipt(token, items, paymentMethod, totalAmount) {
  const goods = items.map((item) => ({
    good: {
      code: String(item.code),
      name: item.name,
      price: Math.round(item.price * 100),
    },
    quantity: Math.round(item.quantity * 1000),
  }));

  const payments = [
    {
      type: paymentMethod === 'card' ? 'CARD' : 'CASH',
      value: Math.round(totalAmount * 100),
    },
  ];

  const response = await fetch(`${BASE_URL}/receipts/sell`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ goods, payments }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Checkbox createReceipt failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

module.exports = { authenticate, openShift, getShiftStatus, createReceipt };
