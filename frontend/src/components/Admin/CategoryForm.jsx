import { useState } from 'react';
import { createCategory, updateCategory } from '../../api';
import { resolveTopCategoryDisplay, resolveSubcategoryDisplay, DEFAULT_THEME } from '../../utils/categoryDisplay';

const ICON_SUGGESTIONS = [
  '☕', '🍵', '🍰', '📦', '🥐', '🧁', '🍪', '🍫', '🥤', '🧊',
  '🌱', '⭐', '🍓', '🌸', '🥭', '🍯', '🍮', '💧', '🍬', '🎂',
];

function CategoryForm({ mode, category, parentCategoryId, onSaved, onCancel }) {
  const isSubcategory = category ? category.parent_category_id != null : parentCategoryId != null;
  const initial = category
    ? isSubcategory
      ? resolveSubcategoryDisplay(category.name)
      : resolveTopCategoryDisplay(category.name)
    : { icon: DEFAULT_THEME.icon, label: '' };

  const [icon, setIcon] = useState(initial.icon);
  const [label, setLabel] = useState(initial.label);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError('Введіть назву');
      return;
    }

    const name = `${(icon || DEFAULT_THEME.icon).trim()} ${label.trim()}`.trim();

    setIsSaving(true);
    try {
      if (mode === 'create') {
        await createCategory({ name, parent_category_id: parentCategoryId ?? null });
      } else {
        await updateCategory(category.id, { name });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  const title =
    mode === 'create'
      ? parentCategoryId
        ? 'Додати підкатегорію'
        : 'Додати категорію'
      : 'Редагувати категорію';

  return (
    <div className="product-form-overlay">
      <form className="product-form" onSubmit={handleSubmit}>
        <h2>{title}</h2>

        {error && <div className="admin-error">{error}</div>}

        <label className="form-field">
          <span>Назва</span>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
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

export default CategoryForm;
