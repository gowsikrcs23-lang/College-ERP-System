const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  fn: {
    type: String,
    required: true
  },
  session: {
    type: String,
    enum: ['morning', 'afternoon'],
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

attendanceSchema.index({ student: 1, fn: 1, session: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);