const Result = require('../models/Result');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

exports.uploadResults = async (req, res) => {
  try {
    const { department, semester, batch, examType, results } = req.body;
    const createdResults = [];
    
    for (const resultData of results) {
      const result = await Result.findOneAndUpdate(
        { student: resultData.studentId, examType, department, semester, batch },
        { student: resultData.studentId, department, semester, batch, examType, subjects: resultData.subjects, totalMarks: resultData.totalMarks, maxTotalMarks: resultData.maxTotalMarks, percentage: resultData.percentage, result: resultData.result },
        { upsert: true, new: true }
      );
      createdResults.push(result);
    }

    try {
      await Notification.create({
        title: 'Results Published',
        message: `${examType} results for ${department} - Semester ${semester} (Batch ${batch}) have been published.`,
        type: 'exam',
        targetAudience: 'students',
        department,
        semester,
        createdBy: req.user._id
      });
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.status(201).json({ message: 'Results uploaded successfully', results: createdResults });
  } catch (error) {
    console.error('Upload results error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.params.studentId }).sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllResults = async (req, res) => {
  try {
    const { department, semester, batch } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = semester;
    if (batch) filter.batch = batch;
    const results = await Result.find(filter).populate('student', 'firstName lastName studentId').sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteResult = async (req, res) => {
  try {
    await Result.findByIdAndDelete(req.params.id);
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all results
exports.deleteAllResults = async (req, res) => {
  try {
    const { department, semester, batch } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = semester;
    if (batch) filter.batch = batch;
    
    const result = await Result.deleteMany(filter);
    res.json({ 
      message: 'Results deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete results for a specific student
exports.deleteStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { department, semester, batch } = req.query;
    
    const filter = { student: studentId };
    if (department) filter.department = department;
    if (semester) filter.semester = semester;
    if (batch) filter.batch = batch;
    
    const result = await Result.deleteMany(filter);
    res.json({ 
      message: 'Student results deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
