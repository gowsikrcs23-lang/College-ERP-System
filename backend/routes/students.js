const express = require('express');
const { body } = require('express-validator');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByDepartment
} = require('../controllers/studentController');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

// Validation rules
const studentValidation = [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty(),
  body('department').notEmpty(),
  body('semester').isInt({ min: 1, max: 8 })
];

// Routes
router.get('/', auth, authorize('admin', 'faculty', 'accountant', 'hod'), getAllStudents);
router.get('/department/:department', auth, authorize('admin', 'faculty', 'accountant', 'hod'), getStudentsByDepartment);
router.get('/:id', auth, getStudentById);
router.post('/', auth, authorize('admin', 'hod'), studentValidation, validate, createStudent);
router.put('/:id', auth, authorize('admin', 'hod'), updateStudent);
router.delete('/:id', auth, authorize('admin', 'hod'), deleteStudent);

module.exports = router;