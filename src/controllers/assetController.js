const path = require('path');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const assetService = require('../services/assetService');
const { badRequest, notFound } = require('../utils/errors');

function assertValidUuid(id, label = 'ID') {
  if (!uuidValidate(id)) {
    throw badRequest(`Invalid ${label}: must be a UUID`);
  }
}

async function createFromUpload(file) {
  const id = uuidv4();
  // Store a relative path for portability; absolute path is still on disk
  const storagePath = path.join('uploads', path.basename(file.path));

  const asset = await assetService.createAsset({
    id,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    storagePath,
  });

  return asset;
}

async function getAsset(assetId) {
  assertValidUuid(assetId, 'assetId');
  const asset = await assetService.findAssetById(assetId);
  if (!asset) {
    throw notFound(`Asset not found: ${assetId}`);
  }
  return asset;
}

module.exports = {
  createFromUpload,
  getAsset,
  assertValidUuid,
};
