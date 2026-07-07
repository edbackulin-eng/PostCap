import { useEffect, useState } from 'react';
import { getProducts, getCategories, getIngredients, deleteProduct } from '../../api';
import ProductForm from './ProductForm';

function flattenCategories(categories) {
  const options = [];
  for (const top of categories) {
    options.push({ id: top.id, label: top.name });
    for (const sub of top.subcategories || []) {
      options.push({ id: sub.id, label: `${top.name} > ${sub.name}` });
    }
  }
  return options;
}

function MenuSection() {
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [formState, setFormState] = useState(null);

  function loadAll() {
    Promise.all([getProducts(), getCategories(), getIngredients()])
      .then(([productsData, categoriesData, ingredientsData]) => {
        setProducts(productsData);
        setCategoryOptions(flattenCategories(categoriesData));
        setIngredients(ingredientsData);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err.message));
  }

  useEffect(loadAll, []);

  async function handleDelete(product) {
    if (!window.confirm(`Видалити товар «${product.name}»?`)) return;

    setActionError(null);
    try {
      await deleteProduct(product.id);
      loadAll();
    } catch (err) {
      setActionError(err.message);
    }
  }

  function handleSaved() {
    setFormState(null);
    loadAll();
  }

  return (
    <div className="menu-section">
      <div className="menu-section-header">
        <h1>Меню</h1>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => setFormState({ mode: 'create' })}
        >
          + Додати товар
        </button>
      </div>

      {loadError && <div className="admin-error">{loadError}</div>}
      {actionError && <div className="admin-error">{actionError}</div>}

      <table className="menu-table">
        <thead>
          <tr>
            <th>Назва</th>
            <th>Категорія</th>
            <th>Ціна</th>
            <th>Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.category?.name}</td>
              <td>{Number(product.price).toFixed(2)} ₴</td>
              <td>
                <span
                  className={`status-badge ${
                    product.is_active ? 'status-badge--active' : 'status-badge--inactive'
                  }`}
                >
                  {product.is_active ? 'Активний' : 'Неактивний'}
                </span>
              </td>
              <td className="menu-table-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--small"
                  onClick={() => setFormState({ mode: 'edit', product })}
                >
                  Редагувати
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--small admin-btn--danger"
                  onClick={() => handleDelete(product)}
                >
                  Видалити
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && !loadError && (
        <div className="menu-empty">Товарів ще немає</div>
      )}

      {formState && (
        <ProductForm
          mode={formState.mode}
          product={formState.product}
          categoryOptions={categoryOptions}
          ingredients={ingredients}
          onSaved={handleSaved}
          onCancel={() => setFormState(null)}
        />
      )}
    </div>
  );
}

export default MenuSection;
