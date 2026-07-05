const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../lib/prisma');
const checkbox = require('../services/checkbox');

const router = express.Router();

async function fiscalizeOrder(order, receiptItems) {
  const token = await checkbox.authenticate();

  let shift = await checkbox.openShift(token);
  for (let i = 0; i < 10 && shift.status !== 'OPENED'; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    shift = await checkbox.getShiftStatus(token, shift.id);
  }
  if (shift.status !== 'OPENED') {
    throw new Error(`Checkbox shift did not open in time (status: ${shift.status})`);
  }

  const receipt = await checkbox.createReceipt(
    token,
    receiptItems,
    order.payment_method,
    Number(order.total_amount)
  );

  return receipt.id;
}

class OrderValidationError extends Error {}

router.post('/', async (req, res, next) => {
  try {
    const { cashier_id, shift_id, payment_method, items } = req.body;

    if (!cashier_id || !shift_id) {
      return res.status(400).json({ error: 'cashier_id and shift_id are required' });
    }
    if (payment_method !== 'cash' && payment_method !== 'card') {
      return res.status(400).json({ error: 'payment_method must be "cash" or "card"' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }
    for (const item of items) {
      if (!item.product_id || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res
          .status(400)
          .json({ error: 'each item requires product_id and a positive integer quantity' });
      }
    }

    const receiptItems = [];

    const order = await prisma.$transaction(async (tx) => {
      const zero = new Prisma.Decimal(0);
      let totalAmount = zero;
      const orderItemsInput = [];
      const ingredientDeductions = new Map();

      for (const item of items) {
        const product = await tx.products.findUnique({
          where: { id: item.product_id },
          include: { recipe: true },
        });
        if (!product) {
          throw new OrderValidationError(`Product ${item.product_id} not found`);
        }

        let unitPrice = product.price;
        if (item.modifier_id) {
          const modifier = await tx.product_modifiers.findUnique({
            where: { id: item.modifier_id },
          });
          if (!modifier || modifier.product_id !== product.id) {
            throw new OrderValidationError(
              `Modifier ${item.modifier_id} is invalid for product ${item.product_id}`
            );
          }
          unitPrice = unitPrice.plus(modifier.price_delta);
        }

        totalAmount = totalAmount.plus(unitPrice.times(item.quantity));

        orderItemsInput.push({
          product_id: item.product_id,
          modifier_id: item.modifier_id ?? null,
          quantity: item.quantity,
          price_at_sale: unitPrice,
        });

        receiptItems.push({
          code: product.id,
          name: product.name,
          price: Number(unitPrice),
          quantity: item.quantity,
        });

        for (const recipeLine of product.recipe) {
          const deduction = recipeLine.quantity_per_unit.times(item.quantity);
          const current = ingredientDeductions.get(recipeLine.ingredient_id) ?? zero;
          ingredientDeductions.set(recipeLine.ingredient_id, current.plus(deduction));
        }
      }

      const createdOrder = await tx.orders.create({
        data: {
          shift_id,
          cashier_id,
          total_amount: totalAmount,
          payment_method,
          order_items: { create: orderItemsInput },
        },
        include: { order_items: true },
      });

      for (const [ingredient_id, amount] of ingredientDeductions) {
        await tx.ingredients.update({
          where: { id: ingredient_id },
          data: { current_stock: { decrement: amount } },
        });

        await tx.stock_movements.create({
          data: {
            ingredient_id,
            change_amount: amount.negated(),
            reason: 'sale',
            order_id: createdOrder.id,
          },
        });
      }

      return createdOrder;
    });

    let fiscalStatus = 'success';
    let fiscalReceiptId = null;

    try {
      fiscalReceiptId = await fiscalizeOrder(order, receiptItems);
    } catch (fiscalErr) {
      console.error('Fiscalization failed for order', order.id, ':', fiscalErr.message);
      fiscalStatus = 'failed';
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: order.id },
      data: { fiscal_status: fiscalStatus, fiscal_receipt_id: fiscalReceiptId },
      include: { order_items: true },
    });

    res.status(201).json(updatedOrder);
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
