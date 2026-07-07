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
      if (data.error && data.error.includes('deactivated')) {
        throw new Error('Цього касира деактивовано. Зверніться до власника.');
      }
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

async function jsonRequest(path, options) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error("Немає з'єднання з сервером");
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Помилка запиту');
  }

  return data;
}

export function getCategories() {
  return jsonRequest('/categories');
}

export function getIngredients() {
  return jsonRequest('/ingredients');
}

export function createProduct(product) {
  return jsonRequest('/products', { method: 'POST', body: JSON.stringify(product) });
}

export function updateProduct(id, product) {
  return jsonRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) });
}

export function deleteProduct(id) {
  return jsonRequest(`/products/${id}`, { method: 'DELETE' });
}

export function restockIngredient(id, amount) {
  return jsonRequest(`/ingredients/${id}/restock`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export function getDailyReport(date) {
  return jsonRequest(`/reports/daily?date=${date}`);
}

export function getShiftsReport(date) {
  return jsonRequest(`/reports/shifts?date=${date}`);
}

export function getCashiers() {
  return jsonRequest('/users');
}

export function createCashier(cashier) {
  return jsonRequest('/users', { method: 'POST', body: JSON.stringify(cashier) });
}

export function deleteCashier(id) {
  return jsonRequest(`/users/${id}`, { method: 'DELETE' });
}

export function deactivateCashier(id) {
  return jsonRequest(`/users/${id}/deactivate`, { method: 'POST' });
}

export function createSubscriptionInvoice(ownerId, plan) {
  return jsonRequest('/subscriptions/create-invoice', {
    method: 'POST',
    body: JSON.stringify({ owner_id: ownerId, plan }),
  });
}

export function getSubscriptionStatus(ownerId) {
  return jsonRequest(`/subscriptions/status/${ownerId}`);
}
