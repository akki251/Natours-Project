class AppError extends Error {
  // we call super constructor of parent class, whenever we extend class
  constructor(message, statusCode) {
    // message stored in error.message as we have extended the Error class
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = apperror;
