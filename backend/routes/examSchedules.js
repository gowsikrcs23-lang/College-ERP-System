const express = require('express');
const {
  createExamSchedule,
  getAllExamSchedules,
  getExamScheduleById,
  updateExamSchedule,
  deleteExamSchedule
} = require('../controllers/examScheduleController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, authorize('admin'), createExamSchedule);
router.get('/', auth, getAllExamSchedules);
router.get('/:id', auth, getExamScheduleById);
router.put('/:id', auth, authorize('admin'), updateExamSchedule);
router.delete('/:id', auth, authorize('admin'), deleteExamSchedule);

module.exports = router;