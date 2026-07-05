import { useState } from 'react';
import { login } from '../api';
import './Login.css';

const MAX_PIN_LENGTH = 10;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

function Login() {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleKeyPress(key) {
    setMessage(null);

    if (key === 'C') {
      setPin('');
      return;
    }
    if (key === '⌫') {
      setPin((prev) => prev.slice(0, -1));
      return;
    }
    setPin((prev) => (prev.length < MAX_PIN_LENGTH ? prev + key : prev));
  }

  async function handleSubmit() {
    if (!pin || isSubmitting) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const user = await login(pin);
      setMessage({ type: 'success', text: `Вхід виконано, вітаю ${user.name}!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <h1 className="login-title">PostCup</h1>

      <div className="pin-display">
        {pin ? '•'.repeat(pin.length) : <span className="pin-placeholder">Введіть PIN</span>}
      </div>

      {message && (
        <div className={`login-message login-message--${message.type}`}>{message.text}</div>
      )}

      <div className="pin-pad">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`pin-key ${key === 'C' || key === '⌫' ? 'pin-key--action' : ''}`}
            onClick={() => handleKeyPress(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="login-submit"
        onClick={handleSubmit}
        disabled={!pin || isSubmitting}
      >
        {isSubmitting ? 'Перевірка...' : 'Увійти'}
      </button>
    </div>
  );
}

export default Login;
