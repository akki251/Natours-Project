const mongoose = require('mongoose');
const validator = require('validator');
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
  }
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

// method on document to check user password and database password
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {

  // return true or false 
  return bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
