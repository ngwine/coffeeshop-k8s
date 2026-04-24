/**
 * Global Error Handler Middleware
 * Xử lý tất cả errors từ routes và controllers
 */
function errorHandler(err, req, res, next) {
  // Log error
  console.error('❌ Error:', {
    message: err.message,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Determine status code
  let status = err.status || err.statusCode || 500;
  if (status < 100 || status > 599) {
    status = 500;
  }

  // Build error response
  const response = {
    success: false,
    status,
    message: err.message || 'Internal Server Error',
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Handle specific error types
  if (err.code === 11000) {
    // MongoDB duplicate key error
    response.status = 400;
    response.message = 'Duplicate entry';
    const field = Object.keys(err.keyPattern)[0];
    response.field = field;
  }

  if (err.name === 'ValidationError') {
    // Mongoose validation error
    response.status = 400;
    response.message = 'Validation error';
    response.errors = Object.values(err.errors).map(e => e.message);
  }

  if (err.name === 'CastError') {
    // Invalid ID format
    response.status = 400;
    response.message = 'Invalid ID format';
  }

  res.status(response.status).json(response);
}

/**
 * Async error wrapper untuk routes
 * Tự động catch errors từ async handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
};
