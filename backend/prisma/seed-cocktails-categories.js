const { PrismaClient } = require('@prisma/client');
const { getProductIcon } = require('./productIcons');

const prisma = new PrismaClient();

// 'Зелений' collides with the tea product of the same name in
// productIcons.js (green tea -> 🍵); override locally so the green
// smoothie gets its own icon without touching the shared map.
const ICON_OVERRIDES = {
  Зелений: '🥬',
};

function iconFor(name) {
  return ICON_OVERRIDES[name] || getProductIcon(name);
}

// Each subcategory + its products, price 0 and no recipe — same treatment
// as "Додатки" and "Інше". 'Мохіто' and 'Полуничний' intentionally repeat
// across subcategories as distinct products (see duplicate check below).
const COCKTAIL_STRUCTURE = [
  {
    subcategory: '🍋 Лимонади',
    products: ['Класичний', 'Цитрусовий', 'Полуничний', 'Манго-Маракуя', 'Мохіто'],
  },
  {
    subcategory: '🥤 Мілкшейки',
    products: ['Ванільний', 'Шоколадний', 'Полуничний', 'Банановий'],
  },
  {
    subcategory: '🍓 Смузі',
    products: ['Манго', 'Полуничний', 'Ягідний', 'Зелений'],
  },
  {
    subcategory: '🍹 Безалкогольні коктейлі',
    products: ['Мохіто', 'Піна Колада', 'Blue Lagoon', 'Shirley Temple'],
  },
  {
    subcategory: '🧃 Фреші',
    products: ['Апельсиновий', 'Яблучний', 'Грейпфрутовий', 'Морквяний'],
  },
];

async function main() {
  let cocktails = await prisma.categories.findFirst({ where: { name: 'Коктейлі', parent_category_id: null } });
  if (!cocktails) {
    cocktails = await prisma.categories.create({ data: { name: 'Коктейлі' } });
  }

  const createdSubcategories = [];
  const createdProducts = [];

  for (const group of COCKTAIL_STRUCTURE) {
    let subcategory = await prisma.categories.findFirst({
      where: { name: group.subcategory, parent_category_id: cocktails.id },
    });
    if (!subcategory) {
      subcategory = await prisma.categories.create({
        data: { name: group.subcategory, parent_category_id: cocktails.id },
      });
      createdSubcategories.push({ name: group.subcategory, status: 'created' });
    } else {
      createdSubcategories.push({ name: group.subcategory, status: 'already existed' });
    }

    for (const name of group.products) {
      // Scoped to this subcategory: 'Мохіто' and 'Полуничний' legitimately
      // appear as distinct products in more than one subcategory.
      const existing = await prisma.products.findFirst({
        where: { name, category_id: subcategory.id },
      });
      if (existing) {
        createdProducts.push({ name, subcategory: group.subcategory, status: 'already existed' });
        continue;
      }

      const product = await prisma.products.create({
        data: { name, category_id: subcategory.id, price: 0, icon: iconFor(name), is_active: true },
      });
      createdProducts.push({ name, subcategory: group.subcategory, status: 'created', id: product.id });
    }
  }

  const result = await prisma.categories.findFirst({
    where: { id: cocktails.id },
    include: { subcategories: { include: { products: true } } },
  });
  console.log(JSON.stringify({ cocktails: result, createdSubcategories, createdProducts }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
