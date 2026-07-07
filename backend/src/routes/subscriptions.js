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
      serviceUrl: process.env.PUBLIC_BACKEND_URL
        ? `${process.env.PUBLIC_BACKEND_URL}/subscriptions/webhook`
        : undefined,
    });

    await prisma.subscriptions.create({
      data: {
        owner_id,
        plan,
        amount: selectedPlan.price,
        status: 'pending',
        order_reference: orderReference,
      },
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

router.get('/status/:ownerId', async (req, res, next) => {
  try {
    const ownerId = Number(req.params.ownerId);

    const subscription = await prisma.subscriptions.findFirst({
      where: { owner_id: ownerId },
      orderBy: { created_at: 'desc' },
    });

    res.json(subscription);
  } catch (err) {
    next(err);
  }
});

router.post('/webhook', async (req, res, next) => {
  try {
    const payload = req.body;

    if (!wayforpay.verifyCallbackSignature(payload)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const subscription = await prisma.subscriptions.findUnique({
      where: { order_reference: payload.orderReference },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found for this orderReference' });
    }

    if (payload.transactionStatus === 'Approved' && subscription.status !== 'active') {
      const startedAt = new Date();
      const expiresAt = new Date(startedAt);
      if (subscription.plan === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: { status: 'active', started_at: startedAt, expires_at: expiresAt },
      });
    }

    res.json(wayforpay.buildAcceptResponse(payload.orderReference));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
