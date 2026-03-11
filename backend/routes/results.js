const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const resultController = require('../controllers/resultController');

router.post('/upload', auth, authorize('admin', 'management'), resultController.uploadResults);
router.get('/student/:studentId', auth, resultController.getStudentResults);
router.get('/', auth, authorize('admin', 'management', 'faculty'), resultController.getAllResults);
router.delete('/:id', auth, authorize('admin', 'management'), resultController.deleteResult);
router.delete('/delete/all', auth, authorize('admin', 'management'), resultController.deleteAllResults);
router.delete('/student/:studentId/delete', auth, authorize('admin', 'management'), resultController.deleteStudentResults);

module.exports = router;
