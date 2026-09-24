import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('ef_token');
    navigate('/login');
  }

  return (
    <div className="sidebar">
      <h1>ExpenseFlow</h1>
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        Dashboard
      </NavLink>
      <NavLink to="/expenses" className={({ isActive }) => (isActive ? 'active' : '')}>
        Expenses
      </NavLink>
      <button className="secondary" style={{ marginTop: 24, width: '100%' }} onClick={logout}>
        Log out
      </button>
    </div>
  );
}
