const stripe = require('stripe')(
  'sk_test_51KblnYSHXreynmNIb9gaRhvrfRHok9WdFvgxCLvG7Nf63LiJ80z6s3jh7lZYE4KrDZrmrDWgcmY8f4mW2zQNY1YS002UbeuOJ1'
);
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Tour = require('../models/tourModel');
const Factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1 get the currently booked tour from params

  const tour = await Tour.findById(req.params.tourID);

  // 2// create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://localhost:3000/`,
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
