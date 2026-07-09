function CategoryTiles({ items, onSelect }) {
  return (
    <div className="category-tiles">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="category-tile"
          style={{ background: item.gradient }}
          onClick={() => onSelect(item)}
        >
          <span className="category-tile-icon">{item.displayIcon}</span>
          <span className="category-tile-label">{item.displayLabel}</span>
        </button>
      ))}
    </div>
  );
}

export default CategoryTiles;
