const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Products that already exist and just need to move to the right subcategory.
const REASSIGN = {
  Капучино: '🥛 Кава з молоком',
  Латте: '🥛 Кава з молоком',
  Американо: '☕ Класична кава',
};

// New products to create. `hasRecipe: false` is used for "Додатки" — those
// are add-on charges, not composed drinks, so they get no recipe.
const NEW_PRODUCTS = [
  // Класична кава
  { name: 'Еспресо', subcategory: '☕ Класична кава' },
  { name: 'Допіо', subcategory: '☕ Класична кава' },
  { name: 'Лонг Блек', subcategory: '☕ Класична кава' },

  // Кава з молоком (Капучино/Латте already exist — reassigned above)
  { name: 'Флет Вайт', subcategory: '🥛 Кава з молоком' },
  { name: 'Макіато', subcategory: '🥛 Кава з молоком' },
  { name: 'Лате Макіато', subcategory: '🥛 Кава з молоком' },
  { name: 'Кортадо', subcategory: '🥛 Кава з молоком' },
  { name: 'Раф кава', subcategory: '🥛 Кава з молоком' },

  // Холодна кава
  { name: 'Айс Лате', subcategory: '🧊 Холодна кава' },
  { name: 'Айс Американо', subcategory: '🧊 Холодна кава' },
  { name: 'Айс Капучино', subcategory: '🧊 Холодна кава' },
  { name: 'Фрапе', subcategory: '🧊 Холодна кава' },
  { name: 'Cold Brew', subcategory: '🧊 Холодна кава' },
  { name: 'Espresso Tonic', subcategory: '🧊 Холодна кава' },

  // Авторські напої
  { name: 'Ванільний лате', subcategory: '⭐ Авторські напої' },
  { name: 'Карамельний лате', subcategory: '⭐ Авторські напої' },
  { name: 'Лавандовий раф', subcategory: '⭐ Авторські напої' },
  { name: 'Мокко', subcategory: '⭐ Авторські напої' },
  { name: 'Гарбузовий лате', subcategory: '⭐ Авторські напої' },
  { name: 'Фісташковий лате', subcategory: '⭐ Авторські напої' },

  // Без кофеїну
  { name: 'Декаф', subcategory: '🌱 Без кофеїну' },

  // Додатки — add-on charges, no recipe
  { name: 'Рослинне молоко', subcategory: '➕ Додатки', hasRecipe: false },
  { name: 'Молоко', subcategory: '➕ Додатки', hasRecipe: false },
  { name: 'Додатковий еспресо', subcategory: '➕ Додатки', hasRecipe: false },
  { name: 'Сироп', subcategory: '➕ Додатки', hasRecipe: false },
  { name: 'Вершки', subcategory: '➕ Додатки', hasRecipe: false },
  { name: 'Маршмелоу', subcategory: '➕ Додатки', hasRecipe: false },
];

async function main() {
  const coffee = await prisma.categories.findFirst({
    where: { name: 'Кава', parent_category_id: null },
    include: { subcategories: true },
  });
  if (!coffee) {
    throw new Error('Parent category "Кава" not found — run seed-coffee-categories.js first.');
  }

  const subcategoryIdByName = Object.fromEntries(coffee.subcategories.map((s) => [s.name, s.id]));
  const ingredients = await prisma.ingredients.findMany();

  const reassigned = [];
  for (const [productName, subcategoryName] of Object.entries(REASSIGN)) {
    const categoryId = subcategoryIdByName[subcategoryName];
    if (!categoryId) throw new Error(`Subcategory not found: ${subcategoryName}`);

    const product = await prisma.products.findFirst({ where: { name: productName } });
    if (!product) {
      reassigned.push({ name: productName, status: 'not found, skipped' });
      continue;
    }

    await prisma.products.update({ where: { id: product.id }, data: { category_id: categoryId } });
    reassigned.push({ name: productName, status: 'reassigned', category_id: categoryId });
  }

  const created = [];
  for (const spec of NEW_PRODUCTS) {
    const categoryId = subcategoryIdByName[spec.subcategory];
    if (!categoryId) throw new Error(`Subcategory not found: ${spec.subcategory}`);

    const existing = await prisma.products.findFirst({ where: { name: spec.name } });
    if (existing) {
      created.push({ name: spec.name, status: 'already existed' });
      continue;
    }

    const hasRecipe = spec.hasRecipe !== false;
    const product = await prisma.products.create({
      data: {
        name: spec.name,
        category_id: categoryId,
        price: 0,
        is_active: true,
        recipe: hasRecipe
          ? {
              create: ingredients.map((ingredient) => ({
                ingredient_id: ingredient.id,
                quantity_per_unit: 0,
              })),
            }
          : undefined,
      },
    });
    created.push({ name: spec.name, status: 'created', id: product.id });
  }

  console.log(JSON.stringify({ reassigned, created }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
