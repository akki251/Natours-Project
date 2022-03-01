const express = require('express');
const morgan = require('morgan');
const app = express();
app.use(express.json());
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.static(`${__dirname}/public`));

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// NOTE: as this will be hit last, that means the route isn't valid
// rest all urls error handling
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
  // NOTE: whenever we pass argument to next express detect as error,and pass on to the global error middleware defined
});

app.use(globalErrorHandler);

module.exports = app;
