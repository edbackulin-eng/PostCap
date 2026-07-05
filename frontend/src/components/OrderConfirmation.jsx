const FISCAL_STATUS_LABELS = {
  success: 'чек фіскалізовано',
  failed: 'не вдалося, буде повторено пізніше',
  pending: 'очікує фіскалізації',
};

function OrderConfirmation({ confirmation }) {
  const fiscalLabel = FISCAL_STATUS_LABELS[confirmation.fiscalStatus] || confirmation.fiscalStatus;

  return (
    <div className="order-confirmation">
      <div className="order-confirmation-box">
        <div className="order-confirmation-check">✓</div>
        <h2>Замовлення прийнято!</h2>
        <p className="order-confirmation-total">
          Сума: {Number(confirmation.total).toFixed(2)} ₴
        </p>
        <p className="order-confirmation-fiscal">Статус фіскалізації: {fiscalLabel}</p>
      </div>
    </div>
  );
}

export default OrderConfirmation;
