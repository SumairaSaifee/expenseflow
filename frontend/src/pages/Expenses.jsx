import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const emptyForm = { amount: '', category: '', description: '', spent_at: '' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  async function load() {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const { expenses } = await api.listExpenses(params);
      setExpenses(expenses);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [search]);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await api.createExpense({ ...form, amount: Number(form.amount) });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete(id) {
    await api.deleteExpense(id);
    load();
  }

  return (
    <div>
      <h2>Expenses</h2>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>Add expense</h3>
        <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 8 }}>
          <input placeholder="Amount" type="number" step="0.01" value={form.amount} onChange={update('amount')} required />
          <input placeholder="Category" value={form.category} onChange={update('category')} required />
          <input placeholder="Description" value={form.description} onChange={update('description')} />
          <input type="date" value={form.spent_at} onChange={update('spent_at')} required />
          <button type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        <input
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 12, width: '100%' }}
        />
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id}>
                <td>{exp.spent_at?.slice(0, 10)}</td>
                <td>{exp.category}</td>
                <td>{exp.description}</td>
                <td>${Number(exp.amount).toFixed(2)}</td>
                <td><button className="danger" onClick={() => onDelete(exp.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
