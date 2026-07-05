const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.categories.findMany({
      where: { parent_category_id: null },
      include: { subcategories: true },
    });

    res.json(categories);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
