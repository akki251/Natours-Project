const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const Review = require('../models/reviewModel');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.status(200).json({
    status: 'success',
    result: reviews.length,
    data: {
      reviews
    }
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  
  // making nested routing work
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }

  if (!req.body.user) {
    // req.user from protect middleware
    req.body.user = req.user._id;
  }

  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview
    }
  });
});
