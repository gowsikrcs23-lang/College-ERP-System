const express = require('express');
const {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification
} = require('../controllers/notificationController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes
router.post('/', auth, authorize('admin'), createNotification);
router.get('/', auth, getNotifications);
router.get('/:id', auth, getNotificationById);
router.put('/:id', auth, authorize('admin'), updateNotification);
router.delete('/:id', auth, authorize('admin'), deleteNotification);

module.exports = router;