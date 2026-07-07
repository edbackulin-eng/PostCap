const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

function isForeignKeyRestriction(err) {
  return err.code === 'P2003' || /foreign key constraint/i.test(err?.message || '');
}

router.get('/', async (req, res, next) => {
  try {
    const cashiers = await prisma.users.findMany({ where: { role: 'cashier' } });

    const withStats = await Promise.all(
      cashiers.map(async (cashier) => {
        const [salesAgg, shiftCount, orderCount] = await Promise.all([
          prisma.orders.aggregate({
            where: { cashier_id: cashier.id },
            _sum: { total_amount: true },
          }),
          prisma.shifts.count({ where: { cashier_id: cashier.id } }),
          prisma.orders.count({ where: { cashier_id: cashier.id } }),
        ]);

        return {
          ...cashier,
          total_sales: salesAgg._sum.total_amount ?? 0,
          has_history: shiftCount > 0 || orderCount > 0,
        };
      })
    );

    res.json(withStats);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, pin_code } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!pin_code || !/^\d+$/.test(pin_code)) {
      return res.status(400).json({ error: 'pin_code must be a non-empty numeric string' });
    }

    const user = await prisma.users.create({
      data: { name, pin_code, role: 'cashier' },
    });

    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'This PIN code is already in use' });
    }
    next(err);
  }
});

router.post('/:id/deactivate', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    const existing = await prisma.users.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Cashier not found' });
    }

    const updated = await prisma.users.update({
      where: { id: userId },
      data: { is_active: false },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    const existing = await prisma.users.findUnique({ where: { id: userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Cashier not found' });
    }

    const openShift = await prisma.shifts.findFirst({
      where: { cashier_id: userId, closed_at: null },
    });
    if (openShift) {
      return res.status(400).json({
        error: 'Cannot delete a cashier with an open shift. Close the shift first.',
      });
    }

    try {
      await prisma.users.delete({ where: { id: userId } });
    } catch (deleteErr) {
      if (isForeignKeyRestriction(deleteErr)) {
        return res.status(409).json({
          error:
            'Cannot delete a cashier with shift or order history. This is kept to preserve reporting integrity.',
        });
      }
      throw deleteErr;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
