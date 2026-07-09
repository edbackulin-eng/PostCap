import { useState } from 'react';

function Cart({ cart, receiptNumber, onIncrement, onDecrement, onRemove, onPay, isPaying, paymentError }) {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const paymentDisabled = cart.length === 0 || isPaying;

  function handleChoosePayment(method) {
    setShowPaymentOptions(false);
    onPay(method);
  }

  return (
    <div className="cart">
      <div className="cart-header">
        <h2 className="cart-title">Кошик</h2>
        <span className="cart-receipt">Чек №{receiptNumber}</span>
      </div>

      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="cart-empty">Кошик порожній</div>
        ) : (
          <table className="cart-table">
            <thead>
              <tr>
                <th>Назва</th>
                <th>К-сть</th>
                <th>Ціна</th>
                <th>Разом</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.product_id}>
                  <td className="cart-table-name">{item.name}</td>
                  <td>
                    <div className="cart-qty-controls">
                      <button type="button" onClick={() => onDecrement(item.product_id)}>
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => onIncrement(item.product_id)}>
                        +
                      </button>
                    </div>
                  </td>
                  <td>{item.price.toFixed(2)} ₴</td>
                  <td className="cart-table-sum">
                    {(item.price * item.quantity).toFixed(2)} ₴
                    <button
                      type="button"
                      className="cart-item-remove"
                      onClick={() => onRemove(item.product_id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="cart-total">
        <span>Разом</span>
        <span>{total.toFixed(2)} ₴</span>
      </div>

      {paymentError && <div className="cart-payment-error">{paymentError}</div>}

      <div className="cart-payment">
        {!showPaymentOptions ? (
          <button
            type="button"
            className="payment-btn payment-btn--main"
            disabled={paymentDisabled}
            onClick={() => setShowPaymentOptions(true)}
          >
            {isPaying ? 'Обробка...' : 'Оплатити'}
          </button>
        ) : (
          <div className="payment-options">
            <div className="payment-options-choices">
              <button
                type="button"
                className="payment-btn payment-btn--cash"
                onClick={() => handleChoosePayment('cash')}
              >
                💵 Готівка
              </button>
              <button
                type="button"
                className="payment-btn payment-btn--card"
                onClick={() => handleChoosePayment('card')}
              >
                💳 Картка
              </button>
            </div>
            <button
              type="button"
              className="payment-options-cancel"
              onClick={() => setShowPaymentOptions(false)}
            >
              Скасувати
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
