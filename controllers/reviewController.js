const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.params.tourId) {
    filter = { tour: req.params.tourId };
  }

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    result: reviews.length,
    data: {
      reviews
    }
  });
});

exports.setTourandUserIds = (req, res, next) => {
  // making nested routing work
  if (!req.body.tour) {
    // as we have set mergeparams true, this will get stored
    req.body.tour = req.params.tourId;
  }

  if (!req.body.user) {
    // req.user from protect middleware
    req.body.user = req.user._id;
  }

  next();
};

exports.createReview = factory.createOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);
