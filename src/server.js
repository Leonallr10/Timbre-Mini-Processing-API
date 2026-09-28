const fs = require('fs');
const { createApp } = require('./app');
const config = require('./config');
const pool = require('./db/pool');

async function start() {
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }

  // Verify DB connectivity before accepting traffic
  try {
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    console.error('Check DATABASE_URL and that migrations have been run.');
    process.exit(1);
  }

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Timbre API listening on http://localhost:${config.port}`);
    console.log(`Upload directory: ${config.uploadDir}`);
  });
}

start();
