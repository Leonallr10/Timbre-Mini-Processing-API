const express = require('express');
const assetController = require('../controllers/assetController');
const jobController = require('../controllers/jobController');
const { uploadMedia } = require('../middleware/upload');

const router = express.Router();

/** POST /assets — upload media file */
router.post('/', uploadMedia, async (req, res, next) => {
  try {
    const asset = await assetController.createFromUpload(req.file);
    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
});

/** GET /assets/:assetId */
router.get('/:assetId', async (req, res, next) => {
  try {
    const asset = await assetController.getAsset(req.params.assetId);
    res.json(asset);
  } catch (err) {
    next(err);
  }
});

/** POST /assets/:assetId/process — start async processing job */
router.post('/:assetId/process', async (req, res, next) => {
  try {
    const job = await jobController.startProcessing(
      req.params.assetId,
      req.body
    );
    res.status(202).json(job);
  } catch (err) {
    next(err);
  }
});

/** GET /assets/:assetId/jobs */
router.get('/:assetId/jobs', async (req, res, next) => {
  try {
    const jobs = await jobController.listJobsForAsset(req.params.assetId);
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
