const pool = require('../db/pool');

function mapJob(row) {
  if (!row) return null;
  return {
    id: row.id,
    assetId: row.asset_id,
    operation: row.operation,
    status: row.status,
    errorMessage: row.error_message || null,
    createdAt: row.created_at,
    completedAt: row.completed_at || null,
  };
}

async function createJob({ id, assetId, operation }) {
  const { rows } = await pool.query(
    `INSERT INTO jobs (id, asset_id, operation, status)
     VALUES ($1, $2, $3, 'queued')
     RETURNING *`,
    [id, assetId, operation]
  );
  return mapJob(rows[0]);
}

async function findJobById(id) {
  const { rows } = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
  return mapJob(rows[0]);
}

async function findJobsByAssetId(assetId) {
  const { rows } = await pool.query(
    `SELECT * FROM jobs WHERE asset_id = $1 ORDER BY created_at DESC`,
    [assetId]
  );
  return rows.map(mapJob);
}

async function updateJobStatus(id, status, { errorMessage = null, completedAt = null } = {}) {
  const { rows } = await pool.query(
    `UPDATE jobs
     SET status = $2,
         error_message = $3,
         completed_at = COALESCE($4, completed_at)
     WHERE id = $1
     RETURNING *`,
    [id, status, errorMessage, completedAt]
  );
  return mapJob(rows[0]);
}

module.exports = {
  createJob,
  findJobById,
  findJobsByAssetId,
  updateJobStatus,
  mapJob,
};
