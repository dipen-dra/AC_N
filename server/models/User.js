const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  passwordHash: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null,
    validate: {
      validator: function(value) {
        if (!value) return true;
        return value.startsWith('data:image/') && value.includes(';base64,');
      },
      message: 'Invalid avatar format'
    }
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  initial: {
    type: String,
    maxlength: 1
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  role: {
    type: String,
    enum: ['Customer', 'Admin', 'Superadmin', 'SuperAdmin'],
    default: 'Customer'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ id: 1 });
userSchema.index({ role: 1 });

// Hide sensitive data
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
