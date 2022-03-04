const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty']
    },

    rating: {
      type: Number,
      required: [true, 'Review Must be there'],
      min: 1,
      max: 5
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// query middleware
reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

// NOTE: static method....
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  // stats is outputed as array
  // saving in corresponding tour
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating
  });

  console.log(stats);
};

reviewSchema.post('save', function() {
  // this points to current on review

  /// as Review is not accessble here we use this.construtor
  this.constructor.calcAverageRatings(this.tour); // ===> // Review.calcAverageRatings(this.tour);

  // post middleware doesn't have access to next
  // next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
