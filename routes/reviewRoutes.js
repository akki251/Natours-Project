const express = require('express');

// NOTE: merge params will gave access review routes to access params from /tourid/reviews
const router = express.Router({ mergeParams: true });

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// POST (/tour/fdsf786ds)->this is redirected from tour router hence which is equal to  /

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourandUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .delete(reviewController.deleteReview)
  .patch(reviewController.updateReview);
// router.route('/').post(reviewController.createReview);

module.exports = router;
