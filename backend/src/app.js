const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const shiftsRoutes = require('./routes/shifts');
const reportsRoutes = require('./routes/reports');
const subscriptionsRoutes = require('./routes/subscriptions');
const ingredientsRoutes = require('./routes/ingredients');
const usersRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/categories', categoriesRoutes);
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
app.use('/shifts', shiftsRoutes);
app.use('/reports', reportsRoutes);
app.use('/subscriptions', subscriptionsRoutes);
app.use('/ingredients', ingredientsRoutes);
app.use('/users', usersRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
