function ProductGrid({ products, onProductClick, loadError, flashingId }) {
  return (
    <div className="product-grid-wrapper">
      {loadError && <div className="grid-error">{loadError}</div>}

      {!loadError && products.length === 0 && (
        <div className="grid-empty">Немає товарів у цій категорії</div>
      )}

      <div className="product-grid">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            className={`product-card ${flashingId === product.id ? 'product-card--flash' : ''}`}
            onClick={() => onProductClick(product)}
          >
            <span className="product-card-icon">{product.name.trim().charAt(0).toUpperCase()}</span>
            <span className="product-card-name">{product.name}</span>
            <span className="product-card-price">{Number(product.price).toFixed(2)} ₴</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProductGrid;
