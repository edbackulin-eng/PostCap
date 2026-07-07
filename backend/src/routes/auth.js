const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { pin_code } = req.body;

    if (!pin_code) {
      return res.status(400).json({ error: 'pin_code is required' });
    }

    const user = await prisma.users.findUnique({ where: { pin_code } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid PIN code' });
    }
    if (!user.is_active) {
      return res.status(401).json({ error: 'This cashier account has been deactivated' });
    }

    res.json({ id: user.id, name: user.name, role: user.role });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
