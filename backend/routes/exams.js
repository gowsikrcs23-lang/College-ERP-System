const express = require('express');
const {
  createExam,
  getAllExams,
  getExamById,
  addResults,
  getStudentResults
} = require('../controllers/examController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes
router.post('/', auth, authorize('faculty', 'admin'), createExam);
router.get('/', auth, getAllExams);
router.get('/:id', auth, getExamById);
router.post('/:examId/results', auth, authorize('faculty'), addResults);
router.get('/student/:studentId/results', auth, getStudentResults);

module.exports = router;