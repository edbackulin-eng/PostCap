const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

const PRODUCT_INCLUDE = {
  category: true,
  modifiers: true,
  recipe: { include: { ingredient: true } },
};

function validateRecipe(recipe) {
  if (!Array.isArray(recipe)) return null;
  for (const item of recipe) {
    if (!item.ingredient_id || !(Number(item.quantity_per_unit) > 0)) {
      return 'each recipe item requires ingredient_id and a positive quantity_per_unit';
    }
  }
  return null;
}

function isForeignKeyRestriction(err) {
  return err.code === 'P2003' || /foreign key constraint/i.test(err?.message || '');
}

router.get('/', async (req, res, next) => {
  try {
    const products = await prisma.products.findMany({ include: PRODUCT_INCLUDE });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category_id, price, icon, is_active, recipe } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!category_id) {
      return res.status(400).json({ error: 'category_id is required' });
    }
    if (price === undefined || Number(price) <= 0) {
      return res.status(400).json({ error: 'price must be a positive number' });
    }

    const recipeItems = Array.isArray(recipe) ? recipe : [];
    const recipeError = validateRecipe(recipeItems);
    if (recipeError) {
      return res.status(400).json({ error: recipeError });
    }

    const category = await prisma.categories.findUnique({ where: { id: category_id } });
    if (!category) {
      return res.status(400).json({ error: `category ${category_id} not found` });
    }

    const product = await prisma.products.create({
      data: {
        name,
        category_id,
        price,
        ...(icon !== undefined && { icon }),
        is_active: is_active ?? true,
        recipe: {
          create: recipeItems.map((item) => ({
            ingredient_id: item.ingredient_id,
            quantity_per_unit: item.quantity_per_unit,
          })),
        },
      },
      include: PRODUCT_INCLUDE,
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const { name, category_id, price, icon, is_active, recipe } = req.body;

    const existing = await prisma.products.findUnique({ where: { id: productId } });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (category_id !== undefined) {
      const category = await prisma.categories.findUnique({ where: { id: category_id } });
      if (!category) {
        return res.status(400).json({ error: `category ${category_id} not found` });
      }
    }

    const recipeItems = Array.isArray(recipe) ? recipe : null;
    if (recipeItems) {
      const recipeError = validateRecipe(recipeItems);
      if (recipeError) {
        return res.status(400).json({ error: recipeError });
      }
    }

    const product = await prisma.$transaction(async (tx) => {
      if (recipeItems) {
        await tx.product_recipe.deleteMany({ where: { product_id: productId } });
      }

      return tx.products.update({
        where: { id: productId },
        data: {
          ...(name !== undefined && { name }),
          ...(category_id !== undefined && { category_id }),
          ...(price !== undefined && { price }),
          ...(icon !== undefined && { icon }),
          ...(is_active !== undefined && { is_active }),
          ...(recipeItems && {
            recipe: {
              create: recipeItems.map((item) => ({
                ingredient_id: item.ingredient_id,
                quantity_per_unit: item.quantity_per_unit,
              })),
            },
          }),
        },
        include: PRODUCT_INCLUDE,
      });
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const productId = Number(req.params.id);

    const existing = await prisma.products.findUnique({ where: { id: productId } });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    try {
      await prisma.$transaction([
        prisma.product_modifiers.deleteMany({ where: { product_id: productId } }),
        prisma.product_recipe.deleteMany({ where: { product_id: productId } }),
        prisma.products.delete({ where: { id: productId } }),
      ]);
    } catch (deleteErr) {
      if (isForeignKeyRestriction(deleteErr)) {
        return res.status(409).json({
          error: 'Cannot delete product referenced by existing orders. Deactivate it instead.',
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
