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

function buildBreadcrumbMap(categories) {
  const map = {};
  for (const top of categories) {
    const topLabel = resolveTopCategoryDisplay(top.name).label;
    map[top.id] = topLabel;
    for (const sub of top.subcategories || []) {
      map[sub.id] = `${topLabel} > ${resolveSubcategoryDisplay(sub.name).label}`;
    }
  }
  return map;
}

function toggleSetItem(set, id) {
  const next = new Set(set);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

function ProductTable({ products, categoryLabelFor, onEdit, onDelete }) {
  if (products.length === 0) {
    return <div className="menu-empty">Товарів ще немає</div>;
  }

  return (
    <table className="menu-table">
      <thead>
        <tr>
          <th></th>
          <th>Назва</th>
          {categoryLabelFor && <th>Категорія</th>}
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
            {categoryLabelFor && <td>{categoryLabelFor(product)}</td>}
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

function MenuSection() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [productFormState, setProductFormState] = useState(null);
  const [categoryFormState, setCategoryFormState] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState(new Set());
  const [expandedSubcategoryIds, setExpandedSubcategoryIds] = useState(new Set());

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

  const categoryOptions = flattenCategories(categories);
  const breadcrumbMap = buildBreadcrumbMap(categories);

  function toggleCategory(id) {
    setActionError(null);
    setExpandedCategoryIds((prev) => toggleSetItem(prev, id));
  }

  function toggleSubcategory(id) {
    setActionError(null);
    setExpandedSubcategoryIds((prev) => toggleSetItem(prev, id));
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

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;
  const searchResults = isSearching
    ? products.filter((p) => p.name.toLowerCase().includes(trimmedQuery))
    : [];

  return (
    <div className="menu-section">
      <div className="menu-section-header">
        <h1>Меню</h1>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => setCategoryFormState({ mode: 'create', parentCategoryId: null })}
        >
          + Додати категорію
        </button>
      </div>

      <div className="menu-search">
        <input
          type="text"
          className="menu-search-input"
          placeholder="🔍 Пошук товару за назвою..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {isSearching && (
          <button type="button" className="menu-search-clear" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      {loadError && <div className="admin-error">{loadError}</div>}
      {actionError && <div className="admin-error">{actionError}</div>}

      {isSearching ? (
        <>
          <h2 className="menu-section-subheader-title">Результати пошуку: «{searchQuery.trim()}»</h2>
          <ProductTable
            products={searchResults}
            categoryLabelFor={(product) => breadcrumbMap[product.category_id] ?? '—'}
            onEdit={(product) => setProductFormState({ mode: 'edit', product })}
            onDelete={handleDeleteProduct}
          />
        </>
      ) : (
        <div className="category-accordion">
          {categories.map((category) => {
            const { icon, label } = resolveTopCategoryDisplay(category.name);
            const isOpen = expandedCategoryIds.has(category.id);
            const directProducts = products.filter((p) => p.category_id === category.id);
            const meta =
              (category.subcategories?.length || 0) > 0
                ? `Підкатегорій: ${category.subcategories.length}`
                : `Товарів: ${directProducts.length}`;

            return (
              <div key={category.id} className="category-accordion-item">
                <div className="category-accordion-header" onClick={() => toggleCategory(category.id)}>
                  <span className={`category-accordion-chevron ${isOpen ? 'category-accordion-chevron--open' : ''}`}>
                    ▶
                  </span>
                  <span className="category-accordion-icon">{icon}</span>
                  <span className="category-accordion-label">{label}</span>
                  <span className="category-accordion-meta">{meta}</span>
                  <div className="category-accordion-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="admin-btn admin-btn--small"
                      onClick={() => setCategoryFormState({ mode: 'edit', category })}
                    >
                      Редагувати
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--small admin-btn--danger"
                      onClick={() => handleDeleteCategory(category, resolveTopCategoryDisplay)}
                    >
                      Видалити
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="category-accordion-body">
                    <div className="menu-section-subheader">
                      <h2>Товари напряму в категорії «{label}»</h2>
                      <button
                        type="button"
                        className="admin-btn admin-btn--small"
                        onClick={() => setProductFormState({ mode: 'create', defaultCategoryId: category.id })}
                      >
                        + Додати товар
                      </button>
                    </div>
                    <ProductTable
                      products={directProducts}
                      onEdit={(product) => setProductFormState({ mode: 'edit', product })}
                      onDelete={handleDeleteProduct}
                    />

                    <div className="menu-section-subheader">
                      <h2>Підкатегорії</h2>
                      <button
                        type="button"
                        className="admin-btn admin-btn--small"
                        onClick={() => setCategoryFormState({ mode: 'create', parentCategoryId: category.id })}
                      >
                        + Додати підкатегорію
                      </button>
                    </div>

                    {(category.subcategories || []).length === 0 && (
                      <div className="menu-empty">Ще немає жодної підкатегорії</div>
                    )}

                    {(category.subcategories || []).map((subcategory) => {
                      const subDisplay = resolveSubcategoryDisplay(subcategory.name);
                      const subOpen = expandedSubcategoryIds.has(subcategory.id);
                      const subProducts = products.filter((p) => p.category_id === subcategory.id);

                      return (
                        <div key={subcategory.id} className="subcategory-accordion-item">
                          <div
                            className="subcategory-accordion-header"
                            onClick={() => toggleSubcategory(subcategory.id)}
                          >
                            <span
                              className={`category-accordion-chevron ${subOpen ? 'category-accordion-chevron--open' : ''}`}
                            >
                              ▶
                            </span>
                            <span className="category-accordion-icon">{subDisplay.icon}</span>
                            <span className="category-accordion-label">{subDisplay.label}</span>
                            <span className="category-accordion-meta">Товарів: {subProducts.length}</span>
                            <div className="category-accordion-actions" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="admin-btn admin-btn--small"
                                onClick={() => setCategoryFormState({ mode: 'edit', category: subcategory })}
                              >
                                Редагувати
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--small admin-btn--danger"
                                onClick={() => handleDeleteCategory(subcategory, resolveSubcategoryDisplay)}
                              >
                                Видалити
                              </button>
                            </div>
                          </div>

                          {subOpen && (
                            <div className="subcategory-accordion-body">
                              <div className="menu-section-subheader">
                                <h2>Товари</h2>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--small"
                                  onClick={() =>
                                    setProductFormState({ mode: 'create', defaultCategoryId: subcategory.id })
                                  }
                                >
                                  + Додати товар
                                </button>
                              </div>
                              <ProductTable
                                products={subProducts}
                                onEdit={(product) => setProductFormState({ mode: 'edit', product })}
                                onDelete={handleDeleteProduct}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {categories.length === 0 && !loadError && <div className="menu-empty">Ще немає жодної категорії</div>}
        </div>
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
