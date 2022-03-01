const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const jwt = require('jsonwebtoken');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // LOOPHOLE : SECURITY BREACH anyone can role as admin in the body and can register
  // const newUser = await User.create(req.body);

  // creating new user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  });

  const token = signToken(newUser._id);
  // // payload ,secret
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN
  // });

  res.status(201).json({
    token,
    user: newUser
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. check if email and password actually exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2, check if user exists and if the password is correct

  // NOTE: as password is hidden from public i.e select false in the model, but we want to access for verification, we use .select(+propertyName)
  const user = await User.findOne({ email }).select('+password');

  // const correct = await  user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3 . if everything is correct send the jwt token

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
});
