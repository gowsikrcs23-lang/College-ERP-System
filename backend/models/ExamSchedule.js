const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema({
  scheduleFor: {
    type: String,
    enum: ['all_departments', 'all', 'specific'],
    default: 'all_departments'
  },
  targetStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  department: {
    type: String,
    required: function() {
      return this.scheduleFor !== 'all_departments' && this.scheduleFor !== 'all';
    }
  },
  semester: {
    type: Number,
    required: function() {
      return this.scheduleFor !== 'all_departments' && this.scheduleFor !== 'all';
    }
  },
  examType: {
    type: String,
    enum: ['Periodical Test 1', 'Periodical Test 2', 'Periodical Test 3', 'Mid-Term', 'End Semester', 'midterm', 'final', 'internal'],
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  exams: [{
    department: {
      type: String
    },
    semester: {
      type: Number
    },
    subject: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    room: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);
