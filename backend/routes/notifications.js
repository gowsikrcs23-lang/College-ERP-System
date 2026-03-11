const express = require('express');
const {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  deleteAllNotifications,
  deleteNotificationsByCreator
} = require('../controllers/notificationController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes - all non-student roles can manage notifications, students can only view
router.post('/', auth, authorize('admin', 'management', 'faculty', 'accountant', 'admission', 'hod'), createNotification);
router.get('/', auth, getNotifications);
router.get('/:id', auth, getNotificationById);
router.put('/:id', auth, authorize('admin', 'management', 'faculty', 'accountant', 'admission', 'hod'), updateNotification);
router.delete('/:id', auth, authorize('admin', 'management', 'faculty', 'accountant', 'admission', 'hod'), deleteNotification);
router.delete('/delete/all', auth, authorize('admin', 'management', 'faculty', 'accountant', 'admission', 'hod'), deleteAllNotifications);
router.delete('/creator/:creatorId/delete', auth, authorize('admin', 'management', 'faculty', 'accountant', 'admission', 'hod'), deleteNotificationsByCreator);

module.exports = router;
