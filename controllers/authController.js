const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// const sendEmail = require('../utils/email');
const { promisify } = require('util');
const crypto = require('crypto');
const Email = require('../utils/email');
const jwt = require('jsonwebtoken');

const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true // prevent modifying of cookie
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  // storing the jwt in cookie
  res.cookie('jwt', token, cookieOptions);

  // hiding password from response
  // NOTE:we aren't making password undefined in the database, as we are not using save,
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
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

  // // payload ,secret
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN
  // });

  // res.status(201).json({
  //   token,
  //   user: newUser
  // });

  // // console.log(newUser);
  // http://localhost:3000/me
  let host;
  if (req.get('host').startsWith(1)) {
    host = 'localhost:3000';
  }
  const url = `${req.protocol}://${host}/me`;

  const emailObject = new Email(newUser, url);
  await emailObject.sendWelcome();

  createSendToken(newUser, 201, res);
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

  createSendToken(user, 200, res);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. getting the token and check if its exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not Logged in, Please log in to get access', 401)
    );
  }

  // 2. validate the token

  // NOTE using promisify to convert jwt.verify into promise, to maintain code consistency
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // // console.log(decoded);
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
  res.locals.user = currentUser;
  req.user = currentUser;
  next();
});

// MIDDLWARE only FOR rendering pages no errors !
exports.isLoggedIn = async (req, res, next) => {
  let currentUser = null;
  let decoded = null;

  if (req.cookies.jwt) {
    // 1. verify the token
    try {
      decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2 check if user still exists

      currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // 4 check if user changed password after the jwt token was issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      // that means it is a logged in user
      // addding it to template .. ie res.locals.user
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  } else {
    next();
  }
};

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
  let host;
  if (req.get('host').startsWith(1)) {
    host = 'localhost:3000';
  }

  try {
    const resetURL = `${
      req.protocol
    }://${host}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

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
  createSendToken(user, 200, res);
});

// updating logged in user password
exports.updatePassword = catchAsync(async (req, res, next) => {
  //  1  get the user from collection
  const user = await User.findById(req.user._id).select('+password');

  // 2. check posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //  if  so update the password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // NOTE: user.findOneAndUpdate will not make validators run hence we don't use it

  //  log the user in again  with new token
  createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success'
  });
};
