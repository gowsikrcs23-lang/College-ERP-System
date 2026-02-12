const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.post('/generate', auth, authorize('faculty'), reportController.generateReport);
router.get('/student/:studentId', auth, authorize('admin', 'student', 'hod', 'faculty'), reportController.getStudentReports);
router.get('/', auth, authorize('admin', 'hod', 'faculty'), reportController.getAllReports);
router.get('/:id', auth, reportController.getReportById);
router.delete('/:id', auth, authorize('admin', 'hod'), reportController.deleteReport);

module.exports = router;
