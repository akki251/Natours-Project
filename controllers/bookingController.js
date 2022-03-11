const stripe = require('stripe')(
  'sk_test_51KblnYSHXreynmNIb9gaRhvrfRHok9WdFvgxCLvG7Nf63LiJ80z6s3jh7lZYE4KrDZrmrDWgcmY8f4mW2zQNY1YS002UbeuOJ1'
);
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const Factory = require('./handlerFactory');
const Booking = require('../models/bookingModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1 get the currently booked tour from params

  const tour = await Tour.findById(req.params.tourID);

  // 2// create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://localhost:3000/?tour=${
      req.params.tourID
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://localhost:3000/tour/${tour.slug}`,
    customer_email: `${req.user.email}`,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'inr',
        quantity: 1
      }
    ]
  });

  // 3 and send it to the client
  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //   this is only temporary. beacuse it's unsecure, everyone can book without paying
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) {
    return next();
  }

  await Booking.create({
    tour,
    user,
    price
  });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = Factory.createOne(Booking);
exports.getBooking = Factory.getOne(Booking);
exports.getAllBookings = Factory.getAll(Booking);
exports.updateBooking = Factory.updateOne(Booking);
exports.deleteBooking = Factory.deleteOne(Booking);
