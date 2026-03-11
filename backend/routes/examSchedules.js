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

router.post('/', auth, authorize('admin', 'management'), createExamSchedule);
router.get('/', auth, getAllExamSchedules);
router.get('/:id', auth, getExamScheduleById);
router.put('/:id', auth, authorize('admin', 'management'), updateExamSchedule);
router.delete('/:id', auth, authorize('admin', 'management'), deleteExamSchedule);

module.exports = router;