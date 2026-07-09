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

router.post('/', async (req, res, next) => {
  try {
    const { name, parent_category_id } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    let parentId = null;
    if (parent_category_id !== undefined && parent_category_id !== null) {
      const parent = await prisma.categories.findUnique({ where: { id: Number(parent_category_id) } });
      if (!parent) {
        return res.status(400).json({ error: `parent category ${parent_category_id} not found` });
      }
      if (parent.parent_category_id !== null) {
        return res.status(400).json({ error: 'cannot nest a subcategory under another subcategory' });
      }
      parentId = parent.id;
    }

    const category = await prisma.categories.create({
      data: { name: name.trim(), parent_category_id: parentId },
      include: { subcategories: true },
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    const { name } = req.body;

    const existing = await prisma.categories.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const category = await prisma.categories.update({
      where: { id: categoryId },
      data: { name: name.trim() },
      include: { subcategories: true },
    });

    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);

    const existing = await prisma.categories.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const [subcategoryCount, productCount] = await Promise.all([
      prisma.categories.count({ where: { parent_category_id: categoryId } }),
      prisma.products.count({ where: { category_id: categoryId } }),
    ]);

    if (subcategoryCount > 0 || productCount > 0) {
      return res.status(409).json({
        error: `Неможливо видалити «${existing.name}»: спочатку приберіть підкатегорії (${subcategoryCount}) і товари (${productCount}), що містяться всередині.`,
      });
    }

    await prisma.categories.delete({ where: { id: categoryId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
