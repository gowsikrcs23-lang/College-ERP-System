const mongoose = require('mongoose');

const classFacultyAssignmentSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  }
}, {
  timestamps: true
});

classFacultyAssignmentSchema.index({ department: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('ClassFacultyAssignment', classFacultyAssignmentSchema);
