const { AppError } = require('../utils/errors');

function errorHandler(err, _req, res, _next) {
  // Multer errors
  if (err && err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the maximum allowed size'
        : err.message;
    return res.status(400).json({
      error: {
        message,
        code: err.code,
      },
    });
  }

  if (err instanceof AppError || err.isOperational) {
    const body = {
      error: {
        message: err.message,
      },
    };
    if (err.details) {
      body.error.details = err.details;
    }
    return res.status(err.statusCode || 500).json(body);
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: {
      message: 'Internal server error',
    },
  });
}

function notFoundHandler(_req, res) {
  res.status(404).json({
    error: {
      message: 'Route not found',
    },
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
