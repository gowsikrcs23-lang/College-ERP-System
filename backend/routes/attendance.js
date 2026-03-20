const express = require('express');
const {
  markAttendance,
  getAttendanceByStudent,
  getAttendanceByClass,
  getAttendanceStats,
  updateAttendance,
  deleteAttendance,
  getAttendanceRequests,
  approveAttendanceRequest,
  rejectAttendanceRequest,
  getMyAttendanceRequests
} = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes
router.post('/mark', auth, authorize('admin', 'management', 'hod', 'faculty', 'accountant', 'admission'), markAttendance);
router.get('/requests', auth, authorize('faculty'), getAttendanceRequests);
router.get('/requests/mine', auth, authorize('admin', 'management', 'hod', 'faculty', 'accountant', 'admission'), getMyAttendanceRequests);
router.put('/requests/:id/approve', auth, authorize('faculty'), approveAttendanceRequest);
router.put('/requests/:id/reject', auth, authorize('faculty'), rejectAttendanceRequest);
router.get('/stats', auth, authorize('faculty', 'admin', 'management', 'hod', 'accountant', 'admission'), getAttendanceStats);
router.get('/student/:studentId', auth, getAttendanceByStudent);
router.get('/class', auth, authorize('faculty', 'admin', 'management', 'hod', 'accountant', 'admission'), getAttendanceByClass);
router.put('/:id', auth, authorize('admin', 'management', 'hod', 'faculty', 'accountant', 'admission'), updateAttendance);
router.delete('/:id', auth, authorize('admin', 'management', 'hod', 'faculty', 'accountant', 'admission'), deleteAttendance);

module.exports = router;
