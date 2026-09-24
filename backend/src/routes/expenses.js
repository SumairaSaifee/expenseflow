const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { connectRedis } = require('../config/redis');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

const cacheKey = (userId) => `expenses:user:${userId}`;

// GET /api/expenses - list (with optional search/category filter), cached in Redis
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const { search, category, month } = req.query;
  const redis = await connectRedis();

  try {
    // Only use the cache for the unfiltered "give me everything" case.
    if (!search && !category && !month) {
      const cached = await redis.get(cacheKey(userId));
      if (cached) {
        return res.json({ source: 'cache', expenses: JSON.parse(cached) });
      }
    }

    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    const params = [userId];

    if (search) {
      query += ' AND description LIKE ?';
      params.push(`%${search}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (month) {
      query += ' AND DATE_FORMAT(spent_at, "%Y-%m") = ?';
      params.push(month);
    }
    query += ' ORDER BY spent_at DESC';

    const [rows] = await pool.query(query, params);

    if (!search && !category && !month) {
      await redis.set(cacheKey(userId), JSON.stringify(rows), { EX: 60 });
    }

    res.json({ source: 'db', expenses: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses', detail: err.message });
  }
});

// GET /api/expenses/summary - monthly totals for dashboard charts
router.get('/summary', async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(spent_at, '%Y-%m') AS month, category, SUM(amount) AS total
       FROM expenses WHERE user_id = ?
       GROUP BY month, category ORDER BY month DESC`,
      [userId]
    );
    res.json({ summary: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to build summary', detail: err.message });
  }
});

router.post(
  '/',
  [
    body('amount').isFloat({ gt: 0 }),
    body('category').notEmpty(),
    body('description').optional(),
    body('spent_at').isISO8601()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = req.user.id;
    const { amount, category, description, spent_at } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO expenses (user_id, amount, category, description, spent_at) VALUES (?, ?, ?, ?, ?)',
        [userId, amount, category, description || null, spent_at]
      );
      const redis = await connectRedis();
      await redis.del(cacheKey(userId));
      res.status(201).json({ id: result.insertId });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create expense', detail: err.message });
    }
  }
);

router.put('/:id', async (req, res) => {
  const userId = req.user.id;
  const { amount, category, description, spent_at } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE expenses SET amount = COALESCE(?, amount), category = COALESCE(?, category),
       description = COALESCE(?, description), spent_at = COALESCE(?, spent_at)
       WHERE id = ? AND user_id = ?`,
      [amount, category, description, spent_at, req.params.id, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Expense not found' });
    const redis = await connectRedis();
    await redis.del(cacheKey(userId));
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense', detail: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  try {
    const [result] = await pool.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [
      req.params.id,
      userId
    ]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Expense not found' });
    const redis = await connectRedis();
    await redis.del(cacheKey(userId));
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense', detail: err.message });
  }
});

module.exports = router;
