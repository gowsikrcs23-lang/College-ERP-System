const express = require('express');
const {
  createFeeRecord,
  getAllFees,
  getStudentFees,
  makePayment,
  getFeeById,
  updateFeeStatus
} = require('../controllers/feeController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes
router.post('/', auth, authorize('accountant'), createFeeRecord);
router.get('/', auth, authorize('admin', 'management', 'accountant', 'faculty'), getAllFees);
router.get('/student/:studentId', auth, getStudentFees);
router.get('/:id', auth, getFeeById);
router.post('/:feeId/payment', auth, authorize('accountant'), makePayment);
router.put('/:id/status', auth, authorize('accountant'), updateFeeStatus);

module.exports = router;