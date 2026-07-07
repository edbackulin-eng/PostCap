import { useState } from 'react';
import { restockIngredient } from '../../api';

function RestockForm({ ingredients, onSaved, onCancel }) {
  const [ingredientId, setIngredientId] = useState(String(ingredients[0]?.id ?? ''));
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!ingredientId) {
      setError('Оберіть інгредієнт');
      return;
    }
    if (!(Number(amount) > 0)) {
      setError('Кількість має бути більше нуля');
      return;
    }

    setIsSaving(true);
    try {
      await restockIngredient(Number(ingredientId), Number(amount));
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  const selectedIngredient = ingredients.find((i) => String(i.id) === ingredientId);

  return (
    <div className="product-form-overlay">
      <form className="product-form" onSubmit={handleSubmit}>
        <h2>Поповнити склад</h2>

        {error && <div className="admin-error">{error}</div>}

        <label className="form-field">
          <span>Інгредієнт</span>
          <select value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
            {ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name} ({ingredient.unit})
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Кількість поповнення{selectedIngredient ? `, ${selectedIngredient.unit}` : ''}</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <div className="product-form-actions">
          <button type="button" className="admin-btn" onClick={onCancel}>
            Скасувати
          </button>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={isSaving}>
            {isSaving ? 'Збереження...' : 'Поповнити'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RestockForm;
