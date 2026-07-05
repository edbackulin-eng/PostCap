const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../lib/prisma');

const router = express.Router();

function getDateRange(dateParam) {
  const dateStr = dateParam || new Date().toISOString().slice(0, 10);
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { dateStr, start, end };
}

router.get('/daily', async (req, res, next) => {
  try {
    const dateParam = req.query.date;
    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
    }

    const { dateStr, start, end } = getDateRange(dateParam);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const orders = await prisma.orders.findMany({
      where: { created_at: { gte: start, lt: end } },
    });

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

    const totalRevenue = cashTotal.plus(cardTotal);

    const topItemsGrouped = await prisma.order_items.groupBy({
      by: ['product_id'],
      where: { order: { created_at: { gte: start, lt: end } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProducts = await Promise.all(
      topItemsGrouped.map(async (row) => {
        const product = await prisma.products.findUnique({ where: { id: row.product_id } });
        return {
          product_id: row.product_id,
          name: product.name,
          quantity_sold: row._sum.quantity,
        };
      })
    );

    res.json({
      date: dateStr,
      total_revenue: totalRevenue,
      cash_total: cashTotal,
      card_total: cardTotal,
      orders_count: orders.length,
      top_products: topProducts,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/shifts', async (req, res, next) => {
  try {
    const dateParam = req.query.date;
    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
    }

    const { dateStr, start, end } = getDateRange(dateParam);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const shifts = await prisma.shifts.findMany({
      where: { opened_at: { gte: start, lt: end } },
      include: { cashier: true, orders: true },
    });

    const zero = new Prisma.Decimal(0);

    const result = shifts.map((shift) => {
      let cashTotal = zero;
      let cardTotal = zero;

      for (const order of shift.orders) {
        if (order.payment_method === 'cash') {
          cashTotal = cashTotal.plus(order.total_amount);
        } else if (order.payment_method === 'card') {
          cardTotal = cardTotal.plus(order.total_amount);
        }
      }

      return {
        shift_id: shift.id,
        cashier: { id: shift.cashier.id, name: shift.cashier.name },
        opened_at: shift.opened_at,
        closed_at: shift.closed_at,
        opening_cash: shift.opening_cash,
        closing_cash: shift.closing_cash,
        orders_count: shift.orders.length,
        cash_total: cashTotal,
        card_total: cardTotal,
        total_sales: cashTotal.plus(cardTotal),
      };
    });

    res.json({ date: dateStr, shifts: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
