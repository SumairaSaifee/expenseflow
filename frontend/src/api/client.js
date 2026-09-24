// In Kubernetes, the frontend talks to the backend through the Ingress path
// /api -> expense-backend-service, so relative URLs work both in dev
// (via Vite proxy, if configured) and in the cluster.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function authHeaders() {
  const token = localStorage.getItem('ef_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  listExpenses: (params = '') => request(`/expenses${params}`),
  summary: () => request('/expenses/summary'),
  createExpense: (payload) => request('/expenses', { method: 'POST', body: payload }),
  updateExpense: (id, payload) => request(`/expenses/${id}`, { method: 'PUT', body: payload }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' })
};
