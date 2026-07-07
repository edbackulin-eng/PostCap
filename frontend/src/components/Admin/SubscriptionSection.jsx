import { useState } from 'react';
import { createSubscriptionInvoice } from '../../api';

const PLANS = [
  { id: 'monthly', label: 'Місячний', price: 500 },
  { id: 'yearly', label: 'Річний', price: 5000 },
];

function SubscriptionSection({ user }) {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);

  async function handlePay(plan) {
    setError(null);
    setLoadingPlan(plan);
    try {
      const invoice = await createSubscriptionInvoice(user.id, plan);
      window.open(invoice.invoiceUrl, '_blank');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="menu-section">
      <div className="menu-section-header">
        <h1>Підписка</h1>
      </div>

      <div className="subscription-status">
        <span className="subscription-status-label">Поточний статус</span>
        <span className="subscription-status-value">Немає активної підписки</span>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="subscription-plans">
        {PLANS.map((plan) => (
          <div key={plan.id} className="subscription-plan-card">
            <span className="subscription-plan-label">{plan.label}</span>
            <span className="subscription-plan-price">{plan.price} грн</span>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={loadingPlan !== null}
              onClick={() => handlePay(plan.id)}
            >
              {loadingPlan === plan.id ? 'Створення рахунку...' : 'Оплатити'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubscriptionSection;
