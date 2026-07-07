const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const ingredients = await prisma.ingredients.findMany();
    res.json(ingredients);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
