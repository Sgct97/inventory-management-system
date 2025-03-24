/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  console.error(`Error: ${err.message}`.red);
  console.error(err.stack);

  // Check if response is already sent
  if (res.headersSent) {
    return next(err);
  }

  // Get status code from the error or default to 500
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    errors: err.errors || null
  });
};

module.exports = { errorHandler }; 