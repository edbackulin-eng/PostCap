const { PrismaClient } = require('@prisma/client');
const { getProductIcon, DEFAULT_PRODUCT_ICON } = require('./productIcons');

const prisma = new PrismaClient();

// Backfills the `icon` column for every existing product, matched by name
// against productIcons.js. Safe to re-run: always syncs to the canonical
// mapping so it can also be used after adding new entries to the map.
async function main() {
  const products = await prisma.products.findMany();

  const updated = [];
  for (const product of products) {
    const icon = getProductIcon(product.name);
    if (product.icon === icon) {
      updated.push({ name: product.name, icon, status: 'unchanged' });
      continue;
    }
    await prisma.products.update({ where: { id: product.id }, data: { icon } });
    updated.push({
      name: product.name,
      icon,
      status: icon === DEFAULT_PRODUCT_ICON ? 'set to default (no mapping found)' : 'updated',
    });
  }

  console.log(JSON.stringify(updated, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
