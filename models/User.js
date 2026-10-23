const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      default: '',
      trim: true
    },
    lastName: {
      type: String,
      default: '',
      trim: true
    },
    login: {
      type: String,
      required: [true, 'Login username is required'],
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    email: {
      type: String,
      default: '',
      trim: true
    },
    role: {
      type: String,
      default: 'user',
      trim: true
    }
  },
  {
    collection: 'users',
    versionKey: false
  }
);

module.exports = mongoose.model('User', userSchema);
