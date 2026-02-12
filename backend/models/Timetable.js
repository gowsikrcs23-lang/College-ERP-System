const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    periods: [{
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      },
      subject: {
        type: String,
        required: true
      },
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty'
      },
      room: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['lecture', 'lab', 'tutorial'],
        default: 'lecture'
      }
    }]
  }],
  academicYear: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Timetable', timetableSchema);