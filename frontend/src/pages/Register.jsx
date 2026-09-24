import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { token } = await api.register(form);
      localStorage.setItem('ef_token', token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-box card">
      <h2>Create account</h2>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={update('name')} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={form.email} onChange={update('email')} type="email" required />
        </div>
        <div className="field">
          <label>Password (min 8 chars)</label>
          <input value={form.password} onChange={update('password')} type="password" minLength={8} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" style={{ width: '100%' }}>Register</button>
      </form>
      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
