const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  reportType: {
    type: String,
    enum: ['attendance', 'exam', 'comprehensive'],
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  attendanceData: {
    totalClasses: Number,
    attendedClasses: Number,
    percentage: Number,
    sessionWise: [{
      date: Date,
      session: String,
      status: String
    }]
  },
  examData: {
    results: [{
      examType: String,
      subjects: [{
        subjectName: String,
        marks: Number,
        maxMarks: Number,
        grade: String
      }],
      totalMarks: Number,
      percentage: Number,
      result: String
    }],
    overallPercentage: Number,
    averageGrade: String
  },
  performanceAnalysis: {
    attendanceStatus: String,
    academicStatus: String,
    overallPerformance: String,
    strengths: [String],
    areasOfImprovement: [String],
    recommendations: [String]
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
