const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.post('/generate', auth, authorize('faculty'), reportController.generateReport);
router.get('/student/:studentId', auth, authorize('admin', 'management', 'student', 'hod', 'faculty'), reportController.getStudentReports);
router.get('/', auth, authorize('admin', 'management', 'hod', 'faculty', 'student'), reportController.getAllReports);
router.get('/:id', auth, reportController.getReportById);
router.delete('/:id', auth, authorize('admin', 'management', 'hod', 'faculty'), reportController.deleteReport);
router.delete('/delete/all', auth, authorize('admin', 'management', 'hod', 'faculty'), reportController.deleteAllReports);
router.delete('/student/:studentId/delete', auth, authorize('admin', 'management', 'hod', 'faculty'), reportController.deleteStudentReports);

module.exports = router;
