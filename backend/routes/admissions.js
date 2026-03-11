const express = require('express');
const {
  submitApplication,
  getAllApplications,
  updateApplicationStatus,
  approveApplication
} = require('../controllers/admissionController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/apply', submitApplication);
router.get('/', auth, authorize('admission', 'admin', 'management'), getAllApplications);
router.put('/:id/status', auth, authorize('admission'), updateApplicationStatus);
router.put('/:id/approve', auth, authorize('admin', 'management'), approveApplication);

module.exports = router;