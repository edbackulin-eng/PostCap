const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const drinks = await prisma.categories.create({
    data: { name: 'Напої' },
  });

  const coffee = await prisma.categories.create({
    data: { name: 'Кава', parent_category_id: drinks.id },
  });

  const coffeeBeans = await prisma.ingredients.create({
    data: { name: 'Кава', unit: 'г', current_stock: 5000 },
  });

  const milk = await prisma.ingredients.create({
    data: { name: 'Молоко', unit: 'мл', current_stock: 10000 },
  });

  const cappuccino = await prisma.products.create({
    data: {
      name: 'Капучино',
      category_id: coffee.id,
      price: 65.0,
      is_active: true,
      recipe: {
        create: [
          { ingredient_id: coffeeBeans.id, quantity_per_unit: 7 },
          { ingredient_id: milk.id, quantity_per_unit: 200 },
        ],
      },
    },
  });

  console.log('Seed complete:', { drinks, coffee, cappuccino });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
