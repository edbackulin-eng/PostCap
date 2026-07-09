const { PrismaClient } = require('@prisma/client');
const { getProductIcon } = require('./productIcons');

const prisma = new PrismaClient();

// Subcategories that used to exist under "Чай" before it was replaced by the
// detailed structure below. Removed on run if present and still empty.
const OLD_TEA_SUBCATEGORIES = ['⚫ Чорний чай', '🍃 Зелений чай', "🌿 Трав'яний чай", '🍓 Фруктовий чай'];

const WATER_INGREDIENT = { name: 'Вода', unit: 'мл' };

// Each tea subcategory + its products. Every product gets a recipe of
// [flavour ingredient, Вода], both at quantity_per_unit: 0 — we're only
// defining which ingredients a drink needs, not how much (the owner fills
// that in later). `flavourIngredient` is reused across products where the
// same base ingredient makes sense (e.g. "Ягідна суміш" for both the hot
// and iced berry tea).
const TEA_STRUCTURE = [
  {
    subcategory: '🍵 Класичний чай',
    products: [
      { name: 'Чорний', flavourIngredient: 'Чорний чай' },
      { name: 'Зелений', flavourIngredient: 'Зелений чай' },
      { name: 'Ерл Грей', flavourIngredient: 'Ерл Грей' },
      { name: 'Жасминовий', flavourIngredient: 'Жасминовий чай' },
      { name: 'Улун', flavourIngredient: 'Улун' },
    ],
  },
  {
    subcategory: "🌿 Трав'яний чай",
    products: [
      { name: 'Ромашка', flavourIngredient: 'Ромашка' },
      { name: "М'ята", flavourIngredient: "М'ята" },
      { name: 'Меліса', flavourIngredient: 'Меліса' },
      { name: 'Чебрець', flavourIngredient: 'Чебрець' },
    ],
  },
  {
    subcategory: '🍓 Фруктовий чай',
    products: [
      { name: 'Ягідний', flavourIngredient: 'Ягідна суміш' },
      { name: 'Обліпиховий', flavourIngredient: 'Обліпиха' },
      { name: 'Манго-Маракуя', flavourIngredient: 'Манго-Маракуя' },
      { name: 'Яблуко-Кориця', flavourIngredient: 'Яблуко-Кориця' },
    ],
  },
  {
    subcategory: '✨ Авторський чай',
    products: [
      { name: 'Імбирно-лимонний', flavourIngredient: 'Імбир-Лимон' },
      { name: 'Обліпиха-Апельсин', flavourIngredient: 'Обліпиха-Апельсин' },
      { name: "Малина-М'ята", flavourIngredient: "Малина-М'ята" },
      { name: 'Журавлина-Апельсин', flavourIngredient: 'Журавлина-Апельсин' },
    ],
  },
  {
    subcategory: '🧊 Холодний чай',
    products: [
      { name: 'Лимон', flavourIngredient: 'Лимон' },
      { name: 'Персик', flavourIngredient: 'Персик' },
      { name: 'Манго', flavourIngredient: 'Манго' },
      { name: 'Ягідний', flavourIngredient: 'Ягідна суміш' },
    ],
  },
];

const OTHER_PRODUCTS = ['Вода негазована', 'Вода газована', 'Цукерки'];

async function findOrCreateIngredient(name, unit) {
  const existing = await prisma.ingredients.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.ingredients.create({ data: { name, unit, current_stock: 0 } });
}

async function main() {
  let tea = await prisma.categories.findFirst({ where: { name: 'Чай', parent_category_id: null } });
  if (!tea) {
    tea = await prisma.categories.create({ data: { name: 'Чай' } });
  }

  // Remove the old, simplified subcategories (safe: they were never given
  // any products).
  const removedOldSubcategories = [];
  for (const name of OLD_TEA_SUBCATEGORIES) {
    const existing = await prisma.categories.findFirst({ where: { name, parent_category_id: tea.id } });
    if (!existing) continue;
    const productCount = await prisma.products.count({ where: { category_id: existing.id } });
    if (productCount > 0) {
      removedOldSubcategories.push({ name, status: 'skipped, has products' });
      continue;
    }
    await prisma.categories.delete({ where: { id: existing.id } });
    removedOldSubcategories.push({ name, status: 'removed' });
  }

  const water = await findOrCreateIngredient(WATER_INGREDIENT.name, WATER_INGREDIENT.unit);

  const createdSubcategories = [];
  const createdProducts = [];

  for (const group of TEA_STRUCTURE) {
    let subcategory = await prisma.categories.findFirst({
      where: { name: group.subcategory, parent_category_id: tea.id },
    });
    if (!subcategory) {
      subcategory = await prisma.categories.create({
        data: { name: group.subcategory, parent_category_id: tea.id },
      });
      createdSubcategories.push({ name: group.subcategory, status: 'created' });
    } else {
      createdSubcategories.push({ name: group.subcategory, status: 'already existed' });
    }

    for (const productSpec of group.products) {
      // Scoped to this subcategory: the same flavour name (e.g. "Ягідний")
      // legitimately appears as a distinct product in more than one
      // subcategory (hot vs iced tea).
      const existingProduct = await prisma.products.findFirst({
        where: { name: productSpec.name, category_id: subcategory.id },
      });
      if (existingProduct) {
        createdProducts.push({ name: productSpec.name, status: 'already existed' });
        continue;
      }

      const flavourIngredient = await findOrCreateIngredient(productSpec.flavourIngredient, 'г');

      const product = await prisma.products.create({
        data: {
          name: productSpec.name,
          category_id: subcategory.id,
          price: 0,
          icon: getProductIcon(productSpec.name),
          is_active: true,
          recipe: {
            create: [
              { ingredient_id: flavourIngredient.id, quantity_per_unit: 0 },
              { ingredient_id: water.id, quantity_per_unit: 0 },
            ],
          },
        },
      });
      createdProducts.push({ name: productSpec.name, status: 'created', id: product.id });
    }
  }

  let other = await prisma.categories.findFirst({ where: { name: 'Інше', parent_category_id: null } });
  if (!other) {
    other = await prisma.categories.create({ data: { name: 'Інше' } });
  }

  const otherProducts = [];
  for (const name of OTHER_PRODUCTS) {
    const existing = await prisma.products.findFirst({ where: { name } });
    if (existing) {
      otherProducts.push({ name, status: 'already existed' });
      continue;
    }
    const product = await prisma.products.create({
      data: { name, category_id: other.id, price: 0, icon: getProductIcon(name), is_active: true },
    });
    otherProducts.push({ name, status: 'created', id: product.id });
  }

  const result = await prisma.categories.findMany({
    where: { parent_category_id: null },
    include: { subcategories: true },
    orderBy: { id: 'asc' },
  });
  console.log(
    JSON.stringify(
      { categories: result, removedOldSubcategories, createdSubcategories, createdProducts, otherProducts },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
