const mongoose = require('mongoose');

const attendanceRequestSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  session: {
    type: String,
    enum: ['morning', 'afternoon'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'od'],
      required: true
    }
  }],
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedByName: {
    type: String,
    trim: true
  },
  requestedByFacultyId: {
    type: String,
    trim: true
  },
  assignedFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedByName: {
    type: String,
    trim: true
  },
  approvedByFacultyId: {
    type: String,
    trim: true
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedByName: {
    type: String,
    trim: true
  },
  rejectedByFacultyId: {
    type: String,
    trim: true
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

attendanceRequestSchema.index(
  { department: 1, semester: 1, session: 1, date: 1, assignedFaculty: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('AttendanceRequest', attendanceRequestSchema);
