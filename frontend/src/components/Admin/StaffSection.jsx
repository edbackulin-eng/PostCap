import { useEffect, useState } from 'react';
import { getCashiers, deleteCashier, deactivateCashier } from '../../api';
import CashierForm from './CashierForm';

const TABS = ['Активні', 'Неактивні'];

function StaffSection() {
  const [cashiers, setCashiers] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [revealedIds, setRevealedIds] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0]);

  function loadCashiers() {
    getCashiers()
      .then((data) => {
        setCashiers(data);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err.message));
  }

  useEffect(loadCashiers, []);

  function toggleReveal(id) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleDelete(cashier) {
    if (!window.confirm(`Видалити касира «${cashier.name}»?`)) return;

    setActionError(null);
    try {
      await deleteCashier(cashier.id);
      loadCashiers();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDeactivate(cashier) {
    if (!window.confirm(`Деактивувати касира «${cashier.name}»? Він більше не зможе увійти.`)) {
      return;
    }

    setActionError(null);
    try {
      await deactivateCashier(cashier.id);
      loadCashiers();
    } catch (err) {
      setActionError(err.message);
    }
  }

  function handleSaved() {
    setShowForm(false);
    loadCashiers();
  }

  const displayedCashiers = cashiers.filter((cashier) =>
    activeTab === 'Активні' ? cashier.is_active : !cashier.is_active
  );

  return (
    <div className="menu-section">
      <div className="menu-section-header">
        <h1>Працівники</h1>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => setShowForm(true)}
        >
          + Додати касира
        </button>
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab ${tab === activeTab ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {loadError && <div className="admin-error">{loadError}</div>}
      {actionError && <div className="admin-error">{actionError}</div>}

      <table className="menu-table">
        <thead>
          <tr>
            <th>Ім'я</th>
            <th>PIN-код</th>
            <th>Дата створення</th>
            <th>Продажів на суму</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {displayedCashiers.map((cashier) => (
            <tr key={cashier.id}>
              <td>{cashier.name}</td>
              <td>
                <span className="pin-cell">
                  {revealedIds.has(cashier.id) ? cashier.pin_code : '••••'}
                </span>
                <button
                  type="button"
                  className="admin-btn admin-btn--small"
                  onClick={() => toggleReveal(cashier.id)}
                >
                  {revealedIds.has(cashier.id) ? 'Приховати' : 'Показати'}
                </button>
              </td>
              <td>{new Date(cashier.created_at).toLocaleDateString('uk-UA')}</td>
              <td>{Number(cashier.total_sales).toFixed(2)} ₴</td>
              <td>
                {activeTab === 'Активні' &&
                  (cashier.has_history ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--small admin-btn--danger"
                      onClick={() => handleDeactivate(cashier)}
                    >
                      Деактивувати
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn--small admin-btn--danger"
                      onClick={() => handleDelete(cashier)}
                    >
                      Видалити
                    </button>
                  ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {displayedCashiers.length === 0 && !loadError && (
        <div className="menu-empty">
          {activeTab === 'Активні' ? 'Активних касирів ще немає' : 'Немає неактивних касирів'}
        </div>
      )}

      {showForm && <CashierForm onSaved={handleSaved} onCancel={() => setShowForm(false)} />}
    </div>
  );
}

export default StaffSection;
