const express = require('express');
const {
  createTimetable,
  getTimetables,
  getTimetableById,
  updateTimetable,
  deleteTimetable
} = require('../controllers/timetableController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes
router.post('/', auth, authorize('admin'), createTimetable);
router.get('/', auth, getTimetables);
router.get('/:id', auth, getTimetableById);
router.put('/:id', auth, authorize('admin'), updateTimetable);
router.delete('/:id', auth, authorize('admin'), deleteTimetable);

module.exports = router;