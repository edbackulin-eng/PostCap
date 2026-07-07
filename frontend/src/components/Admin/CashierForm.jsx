import { useState } from 'react';
import { createCashier } from '../../api';

function CashierForm({ onSaved, onCancel }) {
  const [name, setName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Введіть ім'я касира");
      return;
    }
    if (!/^\d+$/.test(pinCode)) {
      setError('PIN-код має складатись лише з цифр');
      return;
    }

    setIsSaving(true);
    try {
      await createCashier({ name: name.trim(), pin_code: pinCode });
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
        <h2>Додати касира</h2>

        {error && <div className="admin-error">{error}</div>}

        <label className="form-field">
          <span>Ім'я</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="form-field">
          <span>PIN-код</span>
          <input
            type="text"
            inputMode="numeric"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
          />
        </label>

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

export default CashierForm;
