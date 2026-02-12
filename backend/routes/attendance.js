const express = require('express');
const {
  markAttendance,
  getAttendanceByStudent,
  getAttendanceByClass,
  getAttendanceStats,
  updateAttendance
} = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes
router.post('/mark', auth, authorize('faculty'), markAttendance);
router.get('/stats', auth, authorize('faculty', 'admin'), getAttendanceStats);
router.get('/student/:studentId', auth, getAttendanceByStudent);
router.get('/class', auth, authorize('faculty', 'admin'), getAttendanceByClass);
router.put('/:id', auth, authorize('faculty'), updateAttendance);

module.exports = router;