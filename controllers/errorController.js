const AppError = require('../utils/apperror');

const handleJWT = () => {
  return new AppError('Invalid Token, Please login Again', 401);
};
const handleJWTexpired = () => {
  return new AppError('Your token has been expired, Please login Again', 401);
};

/// converting weird looking errors into some sensible, errors using out app error class
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
  const value = err.keyValue.name;
  const message = `Duplicate field value : ${value}. please use another value!`;
  return new AppError(message, 404);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message); // looping through object
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  // API MEANS DEVELOPMENT
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  } else {
    // RENDERED ERROR PAGE
    return res.status(err.statusCode).render('error', {
      title: 'something went wrong !!',
      msg: err.message
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // for API
  if (req.originalUrl.startsWith('/api')) {
    // Operational that we send errors
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      console.error('ERROR😒', err);
      // these are programming errors, we dont want to this to leaked to users
      return res.status(500).json({
        status: 'error',
        message: 'something went very wrong'
      });
    }
  } else {
    // RENDERED WEBSITE
    if (err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'something went wrong !!',
        msg: err.message
      });
    } else {
      console.error('ERROR😒', err);
      return res.status(err.statusCode).render('error', {
        title: 'something went wrong !!',
        msg: 'Please try again later'
      });
    }
  }
};

// GLOBAL ERROR MIDDLEWARE
//NOTE: giving 4 arguments to middleware will automatically detected as error middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; // creating hardcopy, as it is not a good practice to overwrite arguments

    error.message = err.message;

    if (error.name === 'CastError') {
      // when id pass not is not valid that is object id
      error = handleCastErrorDB(error);
    }

    if (error.code === 11000) {
      // when duplicate fields error has occurred
      error = handleDuplicateErrorDB(error);
    }

    // validation error
    if (error._message === 'Validation failed') {
      error = handleValidationErrorDB(error);
    }

    // jwt validation error handling
    if (error.name === 'JsonWebTokenError') {
      error = handleJWT();
    }

    // jwt token expire error handling
    if (error.name === 'TokenExpiredError') {
      error = handleJWTexpired();
    }

    // console.log(error);

    sendErrorProd(error, req, res);
  }
};
