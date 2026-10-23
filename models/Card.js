const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    playerName: {
      type: String,
      trim: true
    },
    teamName: {
      type: String,
      default: '',
      trim: true
    },
    cardValue: {
      type: Number,
      default: 0
    },
    publisher: {
      type: String,
      default: '',
      trim: true
    },
    card: {
      type: String,
      trim: true
    },
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true
    }
  },
  {
    collection: 'cards',
    versionKey: false
  }
);

module.exports = mongoose.model('Card', cardSchema);
