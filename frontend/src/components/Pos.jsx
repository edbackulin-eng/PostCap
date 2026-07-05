import { useEffect, useState } from 'react';
import { getProducts, openShift, createOrder } from '../api';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import OrderConfirmation from './OrderConfirmation';
import './Pos.css';

const TABS = ['Напої', 'Десерти'];

function Pos({ user }) {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [cart, setCart] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [shiftId, setShiftId] = useState(null);
  const [shiftError, setShiftError] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    openShift(user.id)
      .then((shift) => setShiftId(shift.id))
      .catch((err) => setShiftError(err.message));
  }, [user.id]);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        { product_id: product.id, name: product.name, price: Number(product.price), quantity: 1 },
      ];
    });
  }

  function updateQuantity(productId, delta) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  }

  async function handlePayment(paymentMethod) {
    if (cart.length === 0 || isPaying) return;

    if (!shiftId) {
      setPaymentError(shiftError || 'Зміну ще не відкрито. Спробуйте ще раз.');
      return;
    }

    setIsPaying(true);
    setPaymentError(null);

    try {
      const order = await createOrder({
        cashier_id: user.id,
        shift_id: shiftId,
        payment_method: paymentMethod,
        items: cart.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
      });

      setConfirmation({ total: order.total_amount, fiscalStatus: order.fiscal_status });
      setCart([]);

      setTimeout(() => setConfirmation(null), 3000);
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setIsPaying(false);
    }
  }

  const displayedProducts = activeTab === 'Напої' ? products : [];

  return (
    <div className="pos-screen">
      <div className="pos-menu">
        <div className="pos-header">
          <span className="pos-title">PostCup</span>
          <span className="pos-cashier">Касир: {user.name}</span>
        </div>
        <ProductGrid
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          products={displayedProducts}
          onProductClick={addToCart}
          loadError={loadError}
        />
      </div>
      <div className="pos-cart">
        <Cart
          cart={cart}
          onIncrement={(id) => updateQuantity(id, 1)}
          onDecrement={(id) => updateQuantity(id, -1)}
          onRemove={removeItem}
          onPay={handlePayment}
          isPaying={isPaying}
          paymentError={paymentError}
        />
      </div>

      {confirmation && <OrderConfirmation confirmation={confirmation} />}
    </div>
  );
}

export default Pos;
