import { useEffect, useState } from 'react';
import { getIngredients } from '../../api';
import RestockForm from './RestockForm';

const LOW_STOCK_THRESHOLD = 500;

function StockSection() {
  const [ingredients, setIngredients] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [showRestockForm, setShowRestockForm] = useState(false);

  function loadIngredients() {
    getIngredients()
      .then((data) => {
        setIngredients(data);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err.message));
  }

  useEffect(loadIngredients, []);

  function handleRestocked() {
    setShowRestockForm(false);
    loadIngredients();
  }

  return (
    <div className="menu-section">
      <div className="menu-section-header">
        <h1>Склад</h1>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => setShowRestockForm(true)}
        >
          + Поповнити склад
        </button>
      </div>

      {loadError && <div className="admin-error">{loadError}</div>}

      <table className="menu-table">
        <thead>
          <tr>
            <th>Назва</th>
            <th>Одиниця</th>
            <th>Залишок</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ingredient) => {
            const isLow = Number(ingredient.current_stock) < LOW_STOCK_THRESHOLD;
            return (
              <tr key={ingredient.id}>
                <td>{ingredient.name}</td>
                <td>{ingredient.unit}</td>
                <td>{Number(ingredient.current_stock).toFixed(0)}</td>
                <td>
                  {isLow && (
                    <span className="low-stock-warning">⚠ Низький залишок</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {ingredients.length === 0 && !loadError && (
        <div className="menu-empty">Інгредієнтів ще немає</div>
      )}

      {showRestockForm && (
        <RestockForm
          ingredients={ingredients}
          onSaved={handleRestocked}
          onCancel={() => setShowRestockForm(false)}
        />
      )}
    </div>
  );
}

export default StockSection;
