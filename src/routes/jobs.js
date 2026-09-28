const express = require('express');
const jobController = require('../controllers/jobController');

const router = express.Router();

/** GET /jobs/:jobId */
router.get('/:jobId', async (req, res, next) => {
  try {
    const job = await jobController.getJob(req.params.jobId);
    res.json(job);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
