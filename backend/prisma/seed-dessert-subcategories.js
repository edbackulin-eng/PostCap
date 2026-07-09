const { PrismaClient } = require('@prisma/client');
const { getProductIcon } = require('./productIcons');

const prisma = new PrismaClient();

// Products that already exist directly under "Десерти" (no subcategory) and
// need to move into "🍰 Торти" instead of being recreated.
const REASSIGN = {
  Чізкейк: '🍰 Торти',
  Тірамісу: '🍰 Торти',
};

// All products, price 0 and no recipe — same treatment as "Додатки".
// Чізкейк/Тірамісу are listed here too so the existence check (scoped by
// name + category_id) naturally skips them once REASSIGN has moved them in.
const DESSERT_STRUCTURE = [
  {
    subcategory: '🍰 Торти',
    products: ['Чізкейк', 'Медівник', 'Наполеон', 'Морквяний торт', 'Тірамісу', 'Шоколадний торт'],
  },
  {
    subcategory: '🥐 Випічка',
    products: ['Круасан класичний', 'Круасан з шоколадом', 'Круасан мигдальний', 'Даніш'],
  },
  {
    subcategory: '🧁 Тістечка',
    products: ['Еклер', 'Брауні', 'Мафін', 'Макарон'],
  },
  {
    subcategory: '🍪 Печиво',
    products: ['Вівсяне', 'Шоколадне', 'Пісочне'],
  },
];

async function main() {
  const desserts = await prisma.categories.findFirst({ where: { name: 'Десерти', parent_category_id: null } });
  if (!desserts) {
    throw new Error('Parent category "Десерти" not found.');
  }

  const createdSubcategories = [];
  const subcategoryIdByName = {};
  for (const group of DESSERT_STRUCTURE) {
    let subcategory = await prisma.categories.findFirst({
      where: { name: group.subcategory, parent_category_id: desserts.id },
    });
    if (!subcategory) {
      subcategory = await prisma.categories.create({
        data: { name: group.subcategory, parent_category_id: desserts.id },
      });
      createdSubcategories.push({ name: group.subcategory, status: 'created' });
    } else {
      createdSubcategories.push({ name: group.subcategory, status: 'already existed' });
    }
    subcategoryIdByName[group.subcategory] = subcategory.id;
  }

  const reassigned = [];
  for (const [productName, subcategoryName] of Object.entries(REASSIGN)) {
    const categoryId = subcategoryIdByName[subcategoryName];
    // Scoped to directly under "Десерти" — these are the pre-existing,
    // not-yet-subcategorized products we're moving.
    const product = await prisma.products.findFirst({
      where: { name: productName, category_id: desserts.id },
    });
    if (!product) {
      reassigned.push({ name: productName, status: 'not found directly under Десерти, skipped' });
      continue;
    }
    await prisma.products.update({
      where: { id: product.id },
      data: { category_id: categoryId, icon: getProductIcon(productName) },
    });
    reassigned.push({ name: productName, status: 'reassigned', category_id: categoryId });
  }

  const createdProducts = [];
  for (const group of DESSERT_STRUCTURE) {
    const categoryId = subcategoryIdByName[group.subcategory];
    for (const name of group.products) {
      // Scoped by name + category_id (bugfix from tea seed): avoids both
      // false-duplicate skips across subcategories and missing the
      // already-reassigned Чізкейк/Тірамісу.
      const existing = await prisma.products.findFirst({ where: { name, category_id: categoryId } });
      if (existing) {
        createdProducts.push({ name, subcategory: group.subcategory, status: 'already existed' });
        continue;
      }
      const product = await prisma.products.create({
        data: { name, category_id: categoryId, price: 0, icon: getProductIcon(name), is_active: true },
      });
      createdProducts.push({ name, subcategory: group.subcategory, status: 'created', id: product.id });
    }
  }

  const result = await prisma.categories.findFirst({
    where: { id: desserts.id },
    include: { subcategories: { include: { products: true } } },
  });
  console.log(JSON.stringify({ desserts: result, createdSubcategories, reassigned, createdProducts }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
