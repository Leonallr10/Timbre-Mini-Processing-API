class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

function notFound(message = 'Resource not found') {
  return new AppError(message, 404);
}

function badRequest(message, details = null) {
  return new AppError(message, 400, details);
}

function conflict(message, details = null) {
  return new AppError(message, 409, details);
}

module.exports = {
  AppError,
  notFound,
  badRequest,
  conflict,
};
