const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ['booking', 'system', 'chat'],
    default: 'system'
  },
  relatedId: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
