const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. get tour data from collection
  const tours = await Tour.find();

  // 2 build template

  // 3render that template

  res.status(200).render('overview', {
    title: 'All tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;

  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    select: 'review rating user -tour'
  });

  res.status(200).render('tour', {
    title: `${tour.name} tour`,
    tour
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {


              res.status(200).render("login" , {
                  title : "Login into your account "
              })


});
