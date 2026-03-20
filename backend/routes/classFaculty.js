const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getClassFacultyAssignments,
  setClassFacultyAssignment
} = require('../controllers/classFacultyController');

const router = express.Router();

router.get('/', auth, authorize('admin', 'management', 'hod', 'faculty', 'student'), getClassFacultyAssignments);
router.put('/', auth, authorize('admin', 'management', 'hod'), setClassFacultyAssignment);

module.exports = router;
