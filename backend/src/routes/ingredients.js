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

router.post('/:id/restock', async (req, res, next) => {
  try {
    const ingredientId = Number(req.params.id);
    const { amount } = req.body;

    if (!(Number(amount) > 0)) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const ingredient = await prisma.ingredients.findUnique({ where: { id: ingredientId } });
    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    const [updatedIngredient] = await prisma.$transaction([
      prisma.ingredients.update({
        where: { id: ingredientId },
        data: { current_stock: { increment: amount } },
      }),
      prisma.stock_movements.create({
        data: {
          ingredient_id: ingredientId,
          change_amount: amount,
          reason: 'manual_restock',
        },
      }),
    ]);

    res.json(updatedIngredient);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
