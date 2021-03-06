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

// so that one user can only create one review
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// query middleware
reviewSchema.pre(/^find/, function(next) {
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

  // only if we have some stats, else reset to default
  if (stats.length > 0) {
    // stats is outputed as array
    // saving in corresponding tour
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

/// this is document middleware i.e save and all ..
reviewSchema.post('save', function() {
  // this points to current on review

  /// as Review is not accessble here we use this.construtor
  this.constructor.calcAverageRatings(this.tour); // ===> // Review.calcAverageRatings(this.tour);

  // post middleware doesn't have access to next
  // next();
});

//// this is query middleware i.e find one and update ,and findby id ...
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();

  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  //  await this.findOne(); doesnot work here, as query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
