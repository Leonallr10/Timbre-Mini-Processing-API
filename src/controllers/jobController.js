const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const config = require('../config');
const assetService = require('../services/assetService');
const jobService = require('../services/jobService');
const processingService = require('../services/processingService');
const { badRequest, notFound } = require('../utils/errors');

function assertValidUuid(id, label = 'ID') {
  if (!uuidValidate(id)) {
    throw badRequest(`Invalid ${label}: must be a UUID`);
  }
}

async function startProcessing(assetId, body) {
  assertValidUuid(assetId, 'assetId');

  const operation = body && body.operation;
  if (!operation || typeof operation !== 'string') {
    throw badRequest('Missing or invalid "operation" field in request body');
  }

  if (!config.supportedOperations.includes(operation)) {
    throw badRequest(
      `Unsupported operation: "${operation}". Supported: ${config.supportedOperations.join(', ')}`
    );
  }

  const asset = await assetService.findAssetById(assetId);
  if (!asset) {
    throw notFound(`Asset not found: ${assetId}`);
  }

  const job = await jobService.createJob({
    id: uuidv4(),
    assetId,
    operation,
  });

  // Fire-and-forget: do not await processing
  processingService.enqueueJob(job.id);

  return job;
}

async function getJob(jobId) {
  assertValidUuid(jobId, 'jobId');
  const job = await jobService.findJobById(jobId);
  if (!job) {
    throw notFound(`Job not found: ${jobId}`);
  }
  return job;
}

async function listJobsForAsset(assetId) {
  assertValidUuid(assetId, 'assetId');
  const asset = await assetService.findAssetById(assetId);
  if (!asset) {
    throw notFound(`Asset not found: ${assetId}`);
  }
  return jobService.findJobsByAssetId(assetId);
}

module.exports = {
  startProcessing,
  getJob,
  listJobsForAsset,
};
