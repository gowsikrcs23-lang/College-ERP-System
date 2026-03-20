const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['general', 'academic', 'fee', 'exam', 'attendance', 'meeting', 'announcement', 'staff', 'admission', 'payment', 'financial', 'reminder', 'college'],
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'faculty', 'admission', 'accountant', 'department'],
    required: true
  },
  targetFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  targetStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  department: {
    type: String
  },
  semester: {
    type: Number
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date
  }
}, {
  timestamps: true,
  indexes: [
    { isActive: 1, targetAudience: 1 },
    { isActive: 1, createdAt: -1 },
    { createdBy: 1, isActive: 1 },
    { targetAudience: 1, department: 1, isActive: 1 },
    { targetAudience: 1, targetFaculty: 1, isActive: 1 },
    { targetAudience: 1, targetStudent: 1, isActive: 1 }
  ]
});

module.exports = mongoose.model('Notification', notificationSchema);
