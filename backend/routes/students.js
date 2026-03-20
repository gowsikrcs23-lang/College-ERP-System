const express = require('express');
const { body } = require('express-validator');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByDepartment,
  blockStudentMail,
  approveStudentMailUnblock,
  unblockStudentMail,
  clearStudentMailBlockCount
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
router.get('/', auth, authorize('admin', 'management', 'faculty', 'accountant', 'hod', 'admission'), getAllStudents);
router.get('/department/:department', auth, authorize('admin', 'management', 'faculty', 'accountant', 'hod', 'admission'), getStudentsByDepartment);
router.get('/:id', auth, getStudentById);
router.post('/', auth, authorize('admin', 'management', 'hod', 'faculty'), studentValidation, validate, createStudent);
router.put('/:id', auth, authorize('admin', 'management', 'hod', 'faculty'), updateStudent);
router.put('/:id/block-mail', auth, authorize('management'), blockStudentMail);
router.put('/:id/approve-unblock', auth, authorize('faculty'), approveStudentMailUnblock);
router.put('/:id/unblock-mail', auth, authorize('management'), unblockStudentMail);
router.put('/:id/clear-mail-block-count', auth, authorize('management'), clearStudentMailBlockCount);
router.delete('/:id', auth, authorize('admin', 'management', 'hod', 'faculty'), deleteStudent);

module.exports = router;
