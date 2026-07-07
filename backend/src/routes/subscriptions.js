const express = require('express');
const prisma = require('../lib/prisma');
const wayforpay = require('../services/wayforpay');

const router = express.Router();

const PLANS = {
  monthly: { name: 'Підписка PostCup — місячний тариф', price: 500 },
  yearly: { name: 'Підписка PostCup — річний тариф', price: 5000 },
};

router.post('/create-invoice', async (req, res, next) => {
  try {
    const { owner_id, plan } = req.body;

    if (!owner_id) {
      return res.status(400).json({ error: 'owner_id is required' });
    }
    if (!plan || !PLANS[plan]) {
      return res
        .status(400)
        .json({ error: `plan must be one of: ${Object.keys(PLANS).join(', ')}` });
    }

    const owner = await prisma.users.findUnique({ where: { id: owner_id } });
    if (!owner || owner.role !== 'admin') {
      return res.status(400).json({ error: 'owner_id must reference an admin user' });
    }

    const selectedPlan = PLANS[plan];
    const orderReference = `sub-${owner_id}-${plan}-${Date.now()}`;

    const invoice = await wayforpay.createInvoice({
      orderReference,
      items: [{ name: selectedPlan.name, price: selectedPlan.price, quantity: 1 }],
    });

    res.status(201).json({
      invoiceUrl: invoice.invoiceUrl,
      qrCode: invoice.qrCode,
      orderReference,
      plan,
      amount: selectedPlan.price,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
