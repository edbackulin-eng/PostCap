import { useEffect, useState } from 'react';
import { getProducts, getCategories, openShift, createOrder } from '../api';
import CategoryTiles from './CategoryTiles';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import OrderConfirmation from './OrderConfirmation';
import './Pos.css';

const CATEGORY_THEME = {
  Кава: { icon: '☕', gradient: 'linear-gradient(135deg, #6b4226, #e08a3c)' },
  Чай: { icon: '🍵', gradient: 'linear-gradient(135deg, #1f7a5c, #4fd1a5)' },
  Десерти: { icon: '🍰', gradient: 'linear-gradient(135deg, #b8447a, #f2a6c6)' },
  Інше: { icon: '📦', gradient: 'linear-gradient(135deg, #4a5568, #8492a6)' },
};
const DEFAULT_THEME = { icon: '🍽️', gradient: 'linear-gradient(135deg, #4f6f8c, #6fa8ff)' };

function splitLeadingEmoji(name) {
  const match = name.match(/^(\p{Emoji}️?)\s*(.*)$/u);
  return match ? { icon: match[1], label: match[2] } : { icon: '•', label: name };
}

function buildTopTile(category) {
  const theme = CATEGORY_THEME[category.name] || DEFAULT_THEME;
  return { ...category, displayIcon: theme.icon, displayLabel: category.name, gradient: theme.gradient };
}

function buildSubTile(subcategory, gradient) {
  const { icon, label } = splitLeadingEmoji(subcategory.name);
  return { ...subcategory, displayIcon: icon, displayLabel: label, gradient };
}

function Pos({ user }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState('categories');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [shiftId, setShiftId] = useState(null);
  const [shiftError, setShiftError] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [flashingId, setFlashingId] = useState(null);
  const [receiptNumber, setReceiptNumber] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setLoadError(err.message));
    getCategories()
      .then(setCategories)
      .catch((err) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    openShift(user.id)
      .then((shift) => setShiftId(shift.id))
      .catch((err) => setShiftError(err.message));
  }, [user.id]);

  function openCategory(category) {
    setActiveCategory(category);
    if (category.subcategories && category.subcategories.length > 0) {
      setView('subcategories');
    } else {
      setActiveSubcategory(null);
      setView('products');
    }
  }

  function openSubcategory(subcategory) {
    setActiveSubcategory(subcategory);
    setView('products');
  }

  function goBack() {
    if (view === 'products' && activeCategory?.subcategories?.length > 0) {
      setActiveSubcategory(null);
      setView('subcategories');
    } else {
      setActiveCategory(null);
      setActiveSubcategory(null);
      setView('categories');
    }
  }

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

    setFlashingId(product.id);
    setTimeout(() => {
      setFlashingId((current) => (current === product.id ? null : current));
    }, 400);
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
      setReceiptNumber((n) => n + 1);

      setTimeout(() => setConfirmation(null), 3000);
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setIsPaying(false);
    }
  }

  const topTiles = categories.map(buildTopTile);
  const subTiles = activeCategory
    ? (activeCategory.subcategories || []).map((s) =>
        buildSubTile(s, (CATEGORY_THEME[activeCategory.name] || DEFAULT_THEME).gradient)
      )
    : [];

  const categoryIdForProducts = activeSubcategory?.id ?? activeCategory?.id ?? null;
  const displayedProducts = categoryIdForProducts
    ? products.filter((p) => p.category_id === categoryIdForProducts)
    : [];

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const searchResults = isSearching
    ? products.filter((p) => p.name.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : [];

  let navTitle = 'Меню';
  if (view === 'subcategories') {
    navTitle = activeCategory.name;
  } else if (view === 'products') {
    navTitle = activeSubcategory ? splitLeadingEmoji(activeSubcategory.name).label : activeCategory.name;
  }

  return (
    <div className="pos-screen">
      <div className="pos-menu">
        <div className="pos-header">
          <span className="pos-title">PostCup</span>
          <span className="pos-cashier">Касир: {user.name}</span>
        </div>

        <div className="pos-search">
          <input
            type="text"
            className="pos-search-input"
            placeholder="🔍 Пошук товару..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
            <button
              type="button"
              className="pos-search-clear"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        {isSearching ? (
          <>
            <div className="pos-nav-header">
              <h2 className="pos-nav-title">Результати пошуку: «{trimmedQuery}»</h2>
            </div>
            <ProductGrid
              products={searchResults}
              onProductClick={addToCart}
              loadError={loadError}
              flashingId={flashingId}
            />
          </>
        ) : (
          <>
            <div className="pos-nav-header">
              {view !== 'categories' && (
                <button type="button" className="pos-back-btn" onClick={goBack}>
                  ← Назад
                </button>
              )}
              <h2 className="pos-nav-title">{navTitle}</h2>
            </div>

            {view === 'categories' && <CategoryTiles items={topTiles} onSelect={openCategory} />}
            {view === 'subcategories' && <CategoryTiles items={subTiles} onSelect={openSubcategory} />}
            {view === 'products' && (
              <ProductGrid
                products={displayedProducts}
                onProductClick={addToCart}
                loadError={loadError}
                flashingId={flashingId}
              />
            )}
          </>
        )}
      </div>
      <div className="pos-cart">
        <Cart
          cart={cart}
          receiptNumber={receiptNumber}
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
