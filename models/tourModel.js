const mongoose = require('mongoose');

const slugify = require('slugify'); // for creating slug.. that is the name of tour in url

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty']
    },

    ratingsAverage: {
      type: Number,
      default: 4.5
    },

    ratingsQuantity: {
      type: Number,
      default: 0
    },

    priceDiscount: {
      type: Number
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A true must have a description']
    },

    description: {
      type: String,
      trim: true
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    rating: {
      type: Number,
      default: 4.5
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // so that it doesn't go up in client side
    },

    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// virtual properties ,
//  we cannot use arrow function because of this.
//  we cannot use virtual properties in queries
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// DOCUMENT middleware
//  pre  : runs before .save() and .create()  but not on insertMany()
tourSchema.pre('save', function(next) {
  // this is document which is going to save
  this.slug = slugify(this.name, {
    lower: true
  });

  next(); // just like express
});

// //post middleware
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE

// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  // this is query, not document
  this.find({ secretTour: { $ne: true } });

  next();
});

// AGGREGATION MIDDLEWARE

tourSchema

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
