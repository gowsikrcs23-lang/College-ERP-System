const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  batch: {
    type: String,
    required: true
  },
  examType: {
    type: String,
    required: true
  },
  subjects: [{
    subjectName: String,
    marks: Number,
    maxMarks: Number,
    grade: String
  }],
  totalMarks: Number,
  maxTotalMarks: Number,
  percentage: Number,
  result: {
    type: String,
    enum: ['Pass', 'Fail']
  }
}, {
  timestamps: true
});

resultSchema.index({ student: 1, examType: 1, department: 1, semester: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
