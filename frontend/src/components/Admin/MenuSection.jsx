import { useEffect, useState } from 'react';
import { getProducts, getCategories, getIngredients, deleteProduct, deleteCategory } from '../../api';
import { resolveTopCategoryDisplay, resolveSubcategoryDisplay } from '../../utils/categoryDisplay';
import ProductForm from './ProductForm';
import CategoryForm from './CategoryForm';

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

function ProductTable({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return <div className="menu-empty">Товарів ще немає</div>;
  }

  return (
    <table className="menu-table">
      <thead>
        <tr>
          <th></th>
          <th>Назва</th>
          <th>Ціна</th>
          <th>Статус</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td className="menu-table-icon">{product.icon}</td>
            <td>{product.name}</td>
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
              <button type="button" className="admin-btn admin-btn--small" onClick={() => onEdit(product)}>
                Редагувати
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--small admin-btn--danger"
                onClick={() => onDelete(product)}
              >
                Видалити
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CategoryList({ items, resolveDisplay, countLabel, onOpen, onEdit, onDelete }) {
  if (items.length === 0) {
    return <div className="menu-empty">Ще немає жодної категорії</div>;
  }

  return (
    <div className="category-manage-list">
      {items.map((item) => {
        const { icon, label } = resolveDisplay(item.name);
        return (
          <div key={item.id} className="category-manage-row">
            <span className="category-manage-icon">{icon}</span>
            <button type="button" className="category-manage-label" onClick={() => onOpen(item)}>
              {label}
            </button>
            <span className="category-manage-meta">{countLabel(item)}</span>
            <div className="category-manage-actions">
              <button type="button" className="admin-btn admin-btn--small" onClick={() => onEdit(item)}>
                Редагувати
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--small admin-btn--danger"
                onClick={() => onDelete(item)}
              >
                Видалити
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MenuSection() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [productFormState, setProductFormState] = useState(null);
  const [categoryFormState, setCategoryFormState] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState(null);

  function loadAll() {
    Promise.all([getProducts(), getCategories(), getIngredients()])
      .then(([productsData, categoriesData, ingredientsData]) => {
        setProducts(productsData);
        setCategories(categoriesData);
        setIngredients(ingredientsData);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err.message));
  }

  useEffect(loadAll, []);

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || null;
  const activeSubcategory = activeCategory?.subcategories?.find((s) => s.id === activeSubcategoryId) || null;
  const categoryOptions = flattenCategories(categories);

  function openCategory(category) {
    setActionError(null);
    setActiveCategoryId(category.id);
    setActiveSubcategoryId(null);
  }

  function openSubcategory(subcategory) {
    setActionError(null);
    setActiveSubcategoryId(subcategory.id);
  }

  function goBack() {
    setActionError(null);
    if (activeSubcategoryId) {
      setActiveSubcategoryId(null);
    } else {
      setActiveCategoryId(null);
    }
  }

  async function handleDeleteProduct(product) {
    if (!window.confirm(`Видалити товар «${product.name}»?`)) return;

    setActionError(null);
    try {
      await deleteProduct(product.id);
      loadAll();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDeleteCategory(category, resolveDisplay) {
    const { label } = resolveDisplay(category.name);
    if (!window.confirm(`Видалити «${label}»?`)) return;

    setActionError(null);
    try {
      await deleteCategory(category.id);
      loadAll();
    } catch (err) {
      setActionError(err.message);
    }
  }

  function handleSaved() {
    setProductFormState(null);
    setCategoryFormState(null);
    loadAll();
  }

  const directProducts = activeCategory ? products.filter((p) => p.category_id === activeCategory.id) : [];
  const subcategoryProducts = activeSubcategory
    ? products.filter((p) => p.category_id === activeSubcategory.id)
    : [];

  return (
    <div className="menu-section">
      <div className="menu-section-header">
        <div className="menu-section-heading">
          {(activeCategoryId || activeSubcategoryId) && (
            <button type="button" className="admin-btn admin-btn--small" onClick={goBack}>
              ← Назад
            </button>
          )}
          <h1>
            {activeSubcategory
              ? `${activeCategory.name} > ${resolveSubcategoryDisplay(activeSubcategory.name).label}`
              : activeCategory
                ? resolveTopCategoryDisplay(activeCategory.name).label
                : 'Меню'}
          </h1>
        </div>

        {!activeCategoryId && (
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => setCategoryFormState({ mode: 'create', parentCategoryId: null })}
          >
            + Додати категорію
          </button>
        )}
        {activeCategoryId && !activeSubcategoryId && (
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => setCategoryFormState({ mode: 'create', parentCategoryId: activeCategory.id })}
          >
            + Додати підкатегорію
          </button>
        )}
        {activeSubcategoryId && (
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() =>
              setProductFormState({ mode: 'create', defaultCategoryId: activeSubcategory.id })
            }
          >
            + Додати товар
          </button>
        )}
      </div>

      {loadError && <div className="admin-error">{loadError}</div>}
      {actionError && <div className="admin-error">{actionError}</div>}

      {!activeCategoryId && (
        <CategoryList
          items={categories}
          resolveDisplay={resolveTopCategoryDisplay}
          countLabel={(c) =>
            (c.subcategories?.length || 0) > 0
              ? `Підкатегорій: ${c.subcategories.length}`
              : `Товарів: ${products.filter((p) => p.category_id === c.id).length}`
          }
          onOpen={openCategory}
          onEdit={(category) => setCategoryFormState({ mode: 'edit', category })}
          onDelete={(category) => handleDeleteCategory(category, resolveTopCategoryDisplay)}
        />
      )}

      {activeCategoryId && !activeSubcategoryId && (
        <>
          <CategoryList
            items={activeCategory.subcategories || []}
            resolveDisplay={resolveSubcategoryDisplay}
            countLabel={(s) => `Товарів: ${products.filter((p) => p.category_id === s.id).length}`}
            onOpen={openSubcategory}
            onEdit={(subcategory) => setCategoryFormState({ mode: 'edit', category: subcategory })}
            onDelete={(subcategory) => handleDeleteCategory(subcategory, resolveSubcategoryDisplay)}
          />

          <div className="menu-section-subheader">
            <h2>Товари напряму в категорії «{resolveTopCategoryDisplay(activeCategory.name).label}»</h2>
            <button
              type="button"
              className="admin-btn admin-btn--small"
              onClick={() =>
                setProductFormState({ mode: 'create', defaultCategoryId: activeCategory.id })
              }
            >
              + Додати товар
            </button>
          </div>
          <ProductTable
            products={directProducts}
            onEdit={(product) => setProductFormState({ mode: 'edit', product })}
            onDelete={handleDeleteProduct}
          />
        </>
      )}

      {activeSubcategoryId && (
        <ProductTable
          products={subcategoryProducts}
          onEdit={(product) => setProductFormState({ mode: 'edit', product })}
          onDelete={handleDeleteProduct}
        />
      )}

      {productFormState && (
        <ProductForm
          mode={productFormState.mode}
          product={productFormState.product}
          defaultCategoryId={productFormState.defaultCategoryId}
          categoryOptions={categoryOptions}
          ingredients={ingredients}
          onSaved={handleSaved}
          onCancel={() => setProductFormState(null)}
        />
      )}

      {categoryFormState && (
        <CategoryForm
          mode={categoryFormState.mode}
          category={categoryFormState.category}
          parentCategoryId={categoryFormState.parentCategoryId}
          onSaved={handleSaved}
          onCancel={() => setCategoryFormState(null)}
        />
      )}
    </div>
  );
}

export default MenuSection;
