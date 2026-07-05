const express = require('express');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');

const app = express();

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/categories', categoriesRoutes);
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
