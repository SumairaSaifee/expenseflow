const express = require('express');
const router = express.Router();
const { pingDb } = require('../config/db');
const { connectRedis } = require('../config/redis');

// Kubernetes probe endpoints (Phase 5 - Health Checks)
// livenessProbe -> /healthz/live   (process is up)
// readinessProbe -> /healthz/ready (can serve traffic: DB + Redis reachable)
// startupProbe   -> /healthz/startup (slow-starting app has finished booting)

router.get('/live', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/ready', async (req, res) => {
  try {
    await pingDb();
    const redis = await connectRedis();
    await redis.ping();
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});

router.get('/startup', (req, res) => {
  res.status(200).json({ status: 'started' });
});

module.exports = router;
