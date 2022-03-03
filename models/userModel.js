const mongoose = require('mongoose');
const validator = require('validator');

const crypto = require('crypto');

const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },

  email: {
    type: String,
    required: [true, 'Please provide your e-mail'],
    unique: true,
    // transform the email to lowercase
    lowercase: true,

    // validates format of email @.com etc...
    validate: [validator.isEmail, 'Please provide a valid email']
  },

  photo: {
    type: String
  },

  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },

  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 8,
    select: false
  },

  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password'],

    // NOTE: this  validator only works on CREATE and SAVE!!!

    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Confirm password and password are not same'
    }
  },

  passwordChangedAt: {
    type: Date
  },

  passwordResetToken: {
    type: String
  },

  passwordResetExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// query middleware ot filter  non active users   
userSchema.pre(/^find/, function(next) {
  // this points to current query
  this.find({ active: { $ne: false } });

  next();
});

// pre save middleware
userSchema.pre('save', async function(next) {
  // checks if password is modified or not
  if (!this.isModified('password')) return next();

  //hashing the password with the intensity of 12
  this.password = await bcrypt.hash(this.password, 12);

  //deleting the confirm password as we no longer  need this field
  this.confirmPassword = undefined;

  next();
});

userSchema.pre('save', function(next) {
  // this.isNew means new document created
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  // to adjust the saving time difference

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// method on document to check user password and database password
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  // return true or false
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimeStamp;
  }

  // NOTE: false means not changed after token issued, that means everything is fine
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  // generating reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encrypting and storing encrypted version in db
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // encrypted reset token expires after 10mins
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // we will send this plain version by email to user
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
