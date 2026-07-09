const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SUBCATEGORIES = [
  '☕ Класична кава',
  '🥛 Кава з молоком',
  '🧊 Холодна кава',
  '⭐ Авторські напої',
  '🌱 Без кофеїну',
  '➕ Додатки',
];

async function main() {
  const coffee = await prisma.categories.findFirst({ where: { name: 'Кава' } });
  if (!coffee) {
    throw new Error('Category "Кава" not found — run the base seed first.');
  }

  // Promote "Кава" to a top-level category.
  await prisma.categories.update({
    where: { id: coffee.id },
    data: { parent_category_id: null },
  });

  // Add the new subcategories under it (skip any that already exist).
  for (const name of SUBCATEGORIES) {
    const existing = await prisma.categories.findFirst({
      where: { name, parent_category_id: coffee.id },
    });
    if (!existing) {
      await prisma.categories.create({
        data: { name, parent_category_id: coffee.id },
      });
    }
  }

  // "Напої" is now an empty, orphaned top-level category — remove it if it
  // has no subcategories and no products left.
  const drinks = await prisma.categories.findFirst({ where: { name: 'Напої', parent_category_id: null } });
  if (drinks) {
    const remainingSubcategories = await prisma.categories.count({ where: { parent_category_id: drinks.id } });
    const productsUsingIt = await prisma.products.count({ where: { category_id: drinks.id } });
    if (remainingSubcategories === 0 && productsUsingIt === 0) {
      await prisma.categories.delete({ where: { id: drinks.id } });
    }
  }

  const result = await prisma.categories.findMany({
    include: { subcategories: true },
    orderBy: { id: 'asc' },
  });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
