const crypto = require('crypto');

const API_URL = 'https://api.wayforpay.com/api';

function sign(fields) {
  const message = fields.join(';');
  return crypto
    .createHmac('md5', process.env.WAYFORPAY_SECRET_KEY)
    .update(message, 'utf8')
    .digest('hex');
}

async function createInvoice({ orderReference, items, currency = 'UAH' }) {
  const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT;
  const merchantDomainName = process.env.WAYFORPAY_DOMAIN;
  const orderDate = Math.floor(Date.now() / 1000);

  const productName = items.map((item) => item.name);
  const productCount = items.map((item) => item.quantity);
  const productPrice = items.map((item) => item.price);
  const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const merchantSignature = sign([
    merchantAccount,
    merchantDomainName,
    orderReference,
    orderDate,
    amount,
    currency,
    ...productName,
    ...productCount,
    ...productPrice,
  ]);

  const payload = {
    transactionType: 'CREATE_INVOICE',
    merchantAccount,
    merchantDomainName,
    merchantSignature,
    apiVersion: 1,
    orderReference,
    orderDate,
    amount,
    currency,
    productName,
    productCount,
    productPrice,
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WayForPay createInvoice failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

module.exports = { createInvoice };
