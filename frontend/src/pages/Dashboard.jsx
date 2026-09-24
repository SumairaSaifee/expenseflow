import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client.js';

export default function Dashboard() {
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.summary().then((d) => setSummary(d.summary)).catch((e) => setError(e.message));
  }, []);

  const byMonth = summary.reduce((acc, row) => {
    const existing = acc.find((r) => r.month === row.month);
    if (existing) existing.total += Number(row.total);
    else acc.push({ month: row.month, total: Number(row.total) });
    return acc;
  }, []).reverse();

  const total = summary.reduce((sum, r) => sum + Number(r.total), 0);

  return (
    <div>
      <h2>Dashboard</h2>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        <div className="card">
          <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Total spending</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>${total.toFixed(2)}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Categories tracked</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {new Set(summary.map((r) => r.category)).size}
          </div>
        </div>
      </div>
      <div className="card" style={{ height: 320 }}>
        <h3>Monthly spending</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={byMonth}>
            <XAxis dataKey="month" stroke="#9aa1ab" />
            <YAxis stroke="#9aa1ab" />
            <Tooltip />
            <Bar dataKey="total" fill="#4f8cff" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
