const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  examType: {
    type: String,
    enum: ['midterm', 'final', 'internal'],
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  exams: [{
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