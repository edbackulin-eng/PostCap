function ProductGrid({ tabs, activeTab, onTabChange, products, onProductClick, loadError }) {
  return (
    <div className="product-grid-wrapper">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab ${tab === activeTab ? 'tab--active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {loadError && <div className="grid-error">{loadError}</div>}

      {!loadError && products.length === 0 && (
        <div className="grid-empty">Немає товарів у цій категорії</div>
      )}

      <div className="product-grid">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            className="product-card"
            onClick={() => onProductClick(product)}
          >
            <span className="product-card-name">{product.name}</span>
            <span className="product-card-price">{Number(product.price).toFixed(2)} ₴</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProductGrid;
