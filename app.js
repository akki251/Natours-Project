const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const cors = require('cors');

const app = express();

// app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
app.use(cors({ credentials: true}));

app.options('*', cors());

//serving static files
app.use(express.static(path.join(__dirname, 'public'))); // app.use(express.static(`${__dirname}/public`));

// a. security http headers
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limiting requests from same ip.
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, Please try again in an hour!'
});

app.use('/api', limiter);

app.use(
  express.json({
    limit: '10kb' // body size max can be 10kb
  })
);

// Data Sanitization again NOSQL query INJECTION
app.use(mongoSanitize());

// DATA sanitization against XSS attack html with js code to damange the serve
app.use(xssClean());

// prevent against parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// NOTE: as this will be hit last, that means the route isn't valid
// rest all urls error handling
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
  // NOTE: whenever we pass argument to next express detect as error,and pass on to the global error middleware defined
});

app.use(globalErrorHandler);

module.exports = app;
