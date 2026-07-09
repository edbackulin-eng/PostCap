import { useState } from 'react';
import { createProduct, updateProduct } from '../../api';

const DEFAULT_ICON = '🍽️';
const ICON_SUGGESTIONS = [
  '☕', '🥛', '🍵', '🧊', '🥤', '🍰', '🥐', '🧁', '🍪', '🍫',
  '🍬', '🍯', '🍮', '🌸', '🍓', '🍋', '🥭', '🍎', '🌿', '💧',
];

function buildInitialRecipeRows(product) {
  if (!product || !product.recipe || product.recipe.length === 0) {
    return [{ ingredientId: '', quantity: '' }];
  }
  return product.recipe.map((r) => ({
    ingredientId: String(r.ingredient_id),
    quantity: String(r.quantity_per_unit),
  }));
}

function ProductForm({ mode, product, categoryOptions, ingredients, defaultCategoryId, onSaved, onCancel }) {
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(
    product ? String(product.category_id) : String(defaultCategoryId ?? categoryOptions[0]?.id ?? '')
  );
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [icon, setIcon] = useState(product?.icon ?? DEFAULT_ICON);
  const [isActive, setIsActive] = useState(product ? product.is_active : true);
  const [recipeRows, setRecipeRows] = useState(buildInitialRecipeRows(product));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  function updateRow(index, field, value) {
    setRecipeRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addRow() {
    setRecipeRows((rows) => [...rows, { ingredientId: '', quantity: '' }]);
  }

  function removeRow(index) {
    setRecipeRows((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Введіть назву товару');
      return;
    }
    if (!categoryId) {
      setError('Оберіть категорію');
      return;
    }
    if (!(Number(price) > 0)) {
      setError('Ціна має бути більше нуля');
      return;
    }

    const recipe = recipeRows
      .filter((row) => row.ingredientId && row.quantity)
      .map((row) => ({
        ingredient_id: Number(row.ingredientId),
        quantity_per_unit: Number(row.quantity),
      }));

    const payload = {
      name: name.trim(),
      category_id: Number(categoryId),
      price: Number(price),
      icon: icon.trim() || DEFAULT_ICON,
      is_active: isActive,
      recipe,
    };

    setIsSaving(true);
    try {
      if (mode === 'create') {
        await createProduct(payload);
      } else {
        await updateProduct(product.id, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="product-form-overlay">
      <form className="product-form" onSubmit={handleSubmit}>
        <h2>{mode === 'create' ? 'Додати товар' : 'Редагувати товар'}</h2>

        {error && <div className="admin-error">{error}</div>}

        <label className="form-field">
          <span>Назва</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="form-field">
          <span>Категорія</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Ціна, ₴</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>

        <div className="form-field">
          <span>Іконка</span>
          <div className="icon-picker">
            <input
              type="text"
              className="icon-picker-input"
              value={icon}
              maxLength={4}
              onChange={(e) => setIcon(e.target.value)}
            />
            <div className="icon-picker-suggestions">
              {ICON_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={`icon-picker-option ${icon === suggestion ? 'icon-picker-option--active' : ''}`}
                  onClick={() => setIcon(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="form-field form-field--checkbox">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>Активний (показувати в касі)</span>
        </label>

        <div className="recipe-builder">
          <span className="form-field-label">Рецептура</span>
          {recipeRows.map((row, index) => (
            <div key={index} className="recipe-row">
              <select
                value={row.ingredientId}
                onChange={(e) => updateRow(index, 'ingredientId', e.target.value)}
              >
                <option value="">— інгредієнт —</option>
                {ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} ({ingredient.unit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="К-сть"
                value={row.quantity}
                onChange={(e) => updateRow(index, 'quantity', e.target.value)}
              />
              <button
                type="button"
                className="recipe-row-remove"
                onClick={() => removeRow(index)}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="admin-btn admin-btn--small" onClick={addRow}>
            + Додати інгредієнт
          </button>
        </div>

        <div className="product-form-actions">
          <button type="button" className="admin-btn" onClick={onCancel}>
            Скасувати
          </button>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={isSaving}>
            {isSaving ? 'Збереження...' : 'Зберегти'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
