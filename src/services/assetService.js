const pool = require('../db/pool');

function mapAsset(row) {
  if (!row) return null;
  return {
    id: row.id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    storagePath: row.storage_path,
    createdAt: row.created_at,
  };
}

async function createAsset({
  id,
  originalName,
  mimeType,
  sizeBytes,
  storagePath,
}) {
  const { rows } = await pool.query(
    `INSERT INTO assets (id, original_name, mime_type, size_bytes, storage_path)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, originalName, mimeType, sizeBytes, storagePath]
  );
  return mapAsset(rows[0]);
}

async function findAssetById(id) {
  const { rows } = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
  return mapAsset(rows[0]);
}

module.exports = {
  createAsset,
  findAssetById,
  mapAsset,
};
