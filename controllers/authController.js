const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/email');
const { promisify } = require('util');
const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // LOOPHOLE : SECURITY BREACH : anyone can role as admin in the body and can register
  // const newUser = await User.create(req.body);

  // creating new user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    // passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
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

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. getting the token and check if its exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not Logged in, Please log in to get access', 401)
    );
  }

  // 2. validate the token

  // NOTE using promisify to convert jwt.verify into promise, to maintain code consistency
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3 check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exists',
        401
      )
    );
  }

  // 4 check if user changed password after the jwt token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password, Please login again', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

// @ route
// .delete(
//   authController.protect,
//   authController.restrictTo("admin" , "lead-guide"),
//   tourController.deleteTour
// );

// @middleware
// RESTRICTIONS MIDDLEWARE

// NOTE: as we cannot pass arguments to a middleware, but
//  we have to  grab so we are returning  middleware function, also using ... operator to convert arguments to array
exports.restrictTo = (...roles) => {
  // this function will have access to roles because of closures
  return (req, res, next) => {
    // roles is an array i.e ['admin' , 'lead guide']

    // NOTE we have access to current user,
    // in the protect middleware we have put the user in the request i.e req.user = currentUser;
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action", 403)
      );
    }

    next();
  };
};

// RESTING PASSWORD

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. get user from email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  // 2 generate random token
  const resetToken = user.createPasswordResetToken();

  // NOTE: whenever we use method from schema and do any update in properties we must save changes
  await user.save({ validateBeforeSave: false });

  // 3 send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your Password ? Submit a patch request with your new password and password Confirm to: ${resetURL}. \n if you didn't forget your password, please ignore this email`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token only valid for 10 mins',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'token send to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email, Please try again later!')
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 get user based on token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2 if token has expired and there is user set the new password

  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  await user.save();

  // 3 Log in the user  and send jwt

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
});
