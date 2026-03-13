const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'management', 'faculty', 'student', 'accountant', 'admission', 'hod'],
    required: true
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailBlocked: {
    type: Boolean,
    default: false
  },
  emailBlockCount: {
    type: Number,
    default: 0
  },
  emailBlockedAt: {
    type: Date
  },
  emailBlockReason: {
    type: String,
    trim: true
  },
  emailBlockHistory: [{
    reason: { type: String, required: true, trim: true },
    blockedAt: { type: Date, default: Date.now },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    facultyApprovedAt: { type: Date },
    facultyApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    facultyApprovedByName: { type: String, trim: true },
    facultyApprovedByFacultyId: { type: String, trim: true },
    unblockedAt: { type: Date },
    unblockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  emailBlockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unblockApprovedByFaculty: {
    type: Boolean,
    default: false
  },
  unblockApprovedAt: {
    type: Date
  },
  unblockApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
