require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const { register, metricsMiddleware } = require('./middleware/metrics');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

app.use('/healthz', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

// Prometheus scrape endpoint (Phase 9 - Monitoring)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/', (req, res) => {
  res.json({ service: 'expenseflow-backend', status: 'running' });
});

app.listen(PORT, () => {
  console.log(`ExpenseFlow backend listening on port ${PORT}`);
});

module.exports = app;
