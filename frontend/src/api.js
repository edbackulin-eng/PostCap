const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function login(pinCode) {
  let response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin_code: pinCode }),
    });
  } catch {
    throw new Error("Немає з'єднання з сервером");
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Невірний PIN-код');
    }
    throw new Error('Помилка входу. Спробуйте ще раз.');
  }

  return data;
}

export async function getProducts() {
  let response;
  try {
    response = await fetch(`${API_URL}/products`);
  } catch {
    throw new Error("Немає з'єднання з сервером");
  }

  if (!response.ok) {
    throw new Error('Не вдалося завантажити товари');
  }

  return response.json();
}

export async function openShift(cashierId) {
  let response;
  try {
    response = await fetch(`${API_URL}/shifts/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cashier_id: cashierId, opening_cash: 0 }),
    });
  } catch {
    throw new Error("Немає з'єднання з сервером");
  }

  const data = await response.json();

  if (!response.ok) {
    if (data.shift_id) {
      return { id: data.shift_id };
    }
    throw new Error(data.error || 'Не вдалося відкрити зміну');
  }

  return data;
}

export async function createOrder(order) {
  let response;
  try {
    response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch {
    throw new Error("Немає з'єднання з сервером");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Не вдалося створити замовлення');
  }

  return data;
}
