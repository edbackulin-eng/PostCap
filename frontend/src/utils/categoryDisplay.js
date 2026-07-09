// Shared category icon/gradient resolution, used by both the POS category
// tiles and the admin category manager so they stay visually consistent.
export const CATEGORY_THEME = {
  Кава: { icon: '☕', gradient: 'linear-gradient(135deg, #6b4226, #e08a3c)' },
  Чай: { icon: '🍵', gradient: 'linear-gradient(135deg, #1f7a5c, #4fd1a5)' },
  Десерти: { icon: '🍰', gradient: 'linear-gradient(135deg, #b8447a, #f2a6c6)' },
  Коктейлі: { icon: '🍹', gradient: 'linear-gradient(135deg, #d6336c, #ffa94d)' },
  Інше: { icon: '📦', gradient: 'linear-gradient(135deg, #4a5568, #8492a6)' },
};

export const DEFAULT_THEME = { icon: '🍽️', gradient: 'linear-gradient(135deg, #4f6f8c, #6fa8ff)' };

// Splits a leading emoji off a category/product name, e.g. "🍰 Торти" ->
// { icon: '🍰', label: 'Торти' }. Returns icon: null when the name has no
// leading emoji (e.g. the plain top-level names "Кава", "Чай").
export function splitLeadingEmoji(name) {
  const match = name.match(/^(\p{Emoji}️?)\s*(.*)$/u);
  return match ? { icon: match[1], label: match[2] } : { icon: null, label: name };
}

// Top-level categories may carry a branded theme (icon + gradient) keyed by
// their label, looked up whether or not the stored name already has an
// emoji prefix — so renaming "Кава" to "☕ Кава" doesn't lose its theme.
export function resolveTopCategoryDisplay(name) {
  const { icon: parsedIcon, label } = splitLeadingEmoji(name);
  const theme = CATEGORY_THEME[label] || CATEGORY_THEME[name];
  if (theme) return { icon: theme.icon, label, gradient: theme.gradient };
  return { icon: parsedIcon || DEFAULT_THEME.icon, label, gradient: DEFAULT_THEME.gradient };
}

export function resolveSubcategoryDisplay(name) {
  const { icon, label } = splitLeadingEmoji(name);
  return { icon: icon || '•', label };
}
