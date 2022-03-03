const mongoose = require('mongoose');

const slugify = require('slugify'); // for creating slug.. that is the name of tour in url

// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true.valueOf,

      // only available for string
      maxLength: [40, 'A tour name must have atmost 40 characters'],
      minLength: [10, 'A tour name must have atleast 10 characters']
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
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy ,  medium or difficult'
      }
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be atleast 1.0'],
      max: [5, 'Rating must be atmost 5.0']
    },

    ratingsQuantity: {
      type: Number,
      default: 0
    },

    priceDiscount: {
      type: Number,

      // custom validator
      validate: {
        validator: function(val) {
          // NOTE:  this kind of validator only for creating new documents, and not for updating
          return val < this.price;
        },
        //mongoose syntax
        message: 'Discount price ({VALUE}) should be below the regular price'
      }
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
      select: false // NOTE: so that it doesn't go up in client side
    },

    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },

    startLocation: {
      // GeoJSON geospatial data

      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// NOTE:
// virtual properties ,
//  we cannot use arrow function because of this.
//  we cannot use virtual properties in queries
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// DOCUMENT middleware
// NOTE: pre  : runs before .save() and .create()  but not on insertMany()
tourSchema.pre('save', function(next) {
  // this is document which is going to save
  this.slug = slugify(this.name, {
    lower: true
  });

  next(); // just like express
});

// QUERY MIDDLEWARE

// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  // this is query, not document
  this.find({ secretTour: { $ne: true } });

  next();
});

tourSchema.pre(/^find/, function(next) {
  // this is query, not document
  this.populate({
    path: 'guides', // populate guides fields
    select: '-__v -passwordChangedAt' // hiding these  fields
  });
  next();
});

// AGGREGATION MIDDLEWARE
// NOTE: this points to aggregation object
tourSchema.pre('aggregate', function(next) {
  //unshift add in front of array
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } }
  });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
