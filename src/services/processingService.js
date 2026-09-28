const config = require('../config');
const jobService = require('./jobService');

/**
 * In-process simulated media processing.
 *
 * For a production system with long-running or high-volume jobs,
 * this would be replaced by a proper queue (BullMQ, SQS, etc.)
 * and worker processes.
 */
function randomDelay() {
  const { min, max } = config.processingDelayMs;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runJob(jobId) {
  try {
    await jobService.updateJobStatus(jobId, 'processing');

    // Simulate work (transcription / noise reduction)
    await new Promise((resolve) => setTimeout(resolve, randomDelay()));

    await jobService.updateJobStatus(jobId, 'completed', {
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`Job ${jobId} failed:`, err.message);
    try {
      await jobService.updateJobStatus(jobId, 'failed', {
        errorMessage: err.message,
        completedAt: new Date().toISOString(),
      });
    } catch (updateErr) {
      console.error(`Failed to mark job ${jobId} as failed:`, updateErr.message);
    }
  }
}

/**
 * Schedule a job without blocking the HTTP response.
 * Uses setImmediate so the request can return first.
 */
function enqueueJob(jobId) {
  setImmediate(() => {
    runJob(jobId).catch((err) => {
      console.error(`Unhandled error in job ${jobId}:`, err);
    });
  });
}

module.exports = {
  enqueueJob,
  runJob,
};
