const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true
  },

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

  ratingAverage: {
    type: Number,
    default: 4.5
  },

  ratingQuantity: {
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

  startDates: [Date]
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
