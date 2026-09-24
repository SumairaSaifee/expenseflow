const mysql = require('mysql2/promise');

// Config is pulled from environment variables, which in Kubernetes are
// injected via ConfigMap (non-secret values) and Secret (credentials).
// See kubernetes/configmaps/app-config.yaml and kubernetes/secrets/app-secrets.yaml
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'expense_user',
  password: process.env.DB_PASSWORD || 'change_me',
  database: process.env.DB_NAME || 'expenses',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function pingDb() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

module.exports = { pool, pingDb };
