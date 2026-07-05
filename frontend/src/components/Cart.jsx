function Cart({ cart, onIncrement, onDecrement, onRemove }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart">
      <h2 className="cart-title">Кошик</h2>

      <div className="cart-items">
        {cart.length === 0 && <div className="cart-empty">Кошик порожній</div>}
        {cart.map((item) => (
          <div key={item.product_id} className="cart-item">
            <div className="cart-item-info">
              <span className="cart-item-name">{item.name}</span>
              <span className="cart-item-price">{(item.price * item.quantity).toFixed(2)} ₴</span>
            </div>
            <div className="cart-item-controls">
              <button type="button" onClick={() => onDecrement(item.product_id)}>
                −
              </button>
              <span className="cart-item-qty">{item.quantity}</span>
              <button type="button" onClick={() => onIncrement(item.product_id)}>
                +
              </button>
              <button
                type="button"
                className="cart-item-remove"
                onClick={() => onRemove(item.product_id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-total">
        <span>Разом</span>
        <span>{total.toFixed(2)} ₴</span>
      </div>

      <div className="cart-payment">
        <button type="button" className="payment-btn payment-btn--cash" disabled={cart.length === 0}>
          Готівка
        </button>
        <button type="button" className="payment-btn payment-btn--card" disabled={cart.length === 0}>
          Картка
        </button>
      </div>
    </div>
  );
}

export default Cart;
