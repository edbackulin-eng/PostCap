const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const products = await prisma.products.findMany({
      include: { category: true, modifiers: true },
    });

    res.json(products);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
