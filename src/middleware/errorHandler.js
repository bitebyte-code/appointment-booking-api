const AppError = require('../utils/AppError');

module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join('; ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier or value';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'This resource conflicts with an existing record';
  } else if (err.name === 'MongoServerError' && err.code === 112) {
    statusCode = 409;
    message = 'Booking conflict; please try again';
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {})
  });
};
