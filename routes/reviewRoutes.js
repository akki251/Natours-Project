const express = require('express');

// NOTE: merge params will gave access review routes to access params from /tourid/reviews
const router = express.Router({ mergeParams: true });

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// POST (/tour/fdsf786ds)->this is redirected from tour router hence which is equal to  /

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourandUserIds,
    reviewController.createReview
  );


     


router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );
// router.route('/').post(reviewController.createReview);

module.exports = router;
