const express = require('express');
const { body } = require('express-validator');
const {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
} = require('../controllers/facultyController');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

// Validation rules
const facultyValidation = [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty(),
  body('department').notEmpty(),
  body('designation').notEmpty(),
  body('qualification').notEmpty()
];

// Routes
router.get('/', auth, authorize('admin', 'hod'), getAllFaculty);
router.get('/:id', auth, getFacultyById);
router.post('/', auth, authorize('admin', 'hod'), facultyValidation, validate, createFaculty);
router.put('/:id', auth, authorize('admin', 'hod'), updateFaculty);
router.delete('/:id', auth, authorize('admin', 'hod'), deleteFaculty);

module.exports = router;