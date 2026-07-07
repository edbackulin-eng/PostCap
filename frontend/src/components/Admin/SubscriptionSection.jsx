import { useEffect, useState } from 'react';
import { createSubscriptionInvoice, getSubscriptionStatus } from '../../api';

const PLANS = [
  { id: 'monthly', label: 'Місячний', price: 500 },
  { id: 'yearly', label: 'Річний', price: 5000 },
];

const PLAN_LABELS = Object.fromEntries(PLANS.map((plan) => [plan.id, plan.label]));

function describeStatus(subscription) {
  if (!subscription) {
    return 'Немає активної підписки';
  }
  if (subscription.status === 'pending') {
    return 'Рахунок створено, очікує оплати';
  }
  if (subscription.status === 'active') {
    const expiresAt = new Date(subscription.expires_at);
    if (expiresAt < new Date()) {
      return `Підписка закінчилась ${expiresAt.toLocaleDateString('uk-UA')}`;
    }
    return `Активна (${PLAN_LABELS[subscription.plan]}) до ${expiresAt.toLocaleDateString('uk-UA')}`;
  }
  return 'Підписка закінчилась';
}

function SubscriptionSection({ user }) {
  const [subscription, setSubscription] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);

  function loadStatus() {
    getSubscriptionStatus(user.id)
      .then((data) => {
        setSubscription(data);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err.message));
  }

  useEffect(loadStatus, [user.id]);

  async function handlePay(plan) {
    setError(null);
    setLoadingPlan(plan);
    try {
      const invoice = await createSubscriptionInvoice(user.id, plan);
      window.open(invoice.invoiceUrl, '_blank');
      loadStatus();
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
        <button type="button" className="admin-btn" onClick={loadStatus}>
          Оновити статус
        </button>
      </div>

      {loadError && <div className="admin-error">{loadError}</div>}

      <div className="subscription-status">
        <span className="subscription-status-label">Поточний статус</span>
        <span className="subscription-status-value">{describeStatus(subscription)}</span>
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
