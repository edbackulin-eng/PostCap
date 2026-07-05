const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../lib/prisma');

const router = express.Router();

router.post('/open', async (req, res, next) => {
  try {
    const { cashier_id, opening_cash } = req.body;

    if (!cashier_id || opening_cash === undefined) {
      return res.status(400).json({ error: 'cashier_id and opening_cash are required' });
    }

    const existingOpenShift = await prisma.shifts.findFirst({
      where: { cashier_id, closed_at: null },
    });
    if (existingOpenShift) {
      return res
        .status(400)
        .json({ error: 'Cashier already has an open shift', shift_id: existingOpenShift.id });
    }

    const shift = await prisma.shifts.create({
      data: { cashier_id, opening_cash },
    });

    res.status(201).json(shift);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/close', async (req, res, next) => {
  try {
    const shiftId = Number(req.params.id);
    const { closing_cash } = req.body;

    if (closing_cash === undefined) {
      return res.status(400).json({ error: 'closing_cash is required' });
    }

    const shift = await prisma.shifts.findUnique({ where: { id: shiftId } });
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    if (shift.closed_at) {
      return res.status(400).json({ error: 'Shift is already closed' });
    }

    const orders = await prisma.orders.findMany({ where: { shift_id: shiftId } });

    const zero = new Prisma.Decimal(0);
    let cashTotal = zero;
    let cardTotal = zero;

    for (const order of orders) {
      if (order.payment_method === 'cash') {
        cashTotal = cashTotal.plus(order.total_amount);
      } else if (order.payment_method === 'card') {
        cardTotal = cardTotal.plus(order.total_amount);
      }
    }

    const totalSales = cashTotal.plus(cardTotal);
    const expectedCash = shift.opening_cash.plus(cashTotal);
    const difference = new Prisma.Decimal(closing_cash).minus(expectedCash);

    const updatedShift = await prisma.shifts.update({
      where: { id: shiftId },
      data: {
        closed_at: new Date(),
        closing_cash,
        total_sales: totalSales,
      },
    });

    res.json({
      shift_id: updatedShift.id,
      orders_count: orders.length,
      cash_total: cashTotal,
      card_total: cardTotal,
      total_sales: totalSales,
      opening_cash: shift.opening_cash,
      closing_cash: updatedShift.closing_cash,
      expected_cash: expectedCash,
      difference,
      opened_at: shift.opened_at,
      closed_at: updatedShift.closed_at,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const shiftId = Number(req.params.id);
    const shift = await prisma.shifts.findUnique({
      where: { id: shiftId },
      include: { orders: true },
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json(shift);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
