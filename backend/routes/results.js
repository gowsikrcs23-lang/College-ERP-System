const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const resultController = require('../controllers/resultController');

router.post('/upload', auth, authorize('admin'), resultController.uploadResults);
router.get('/student/:studentId', auth, resultController.getStudentResults);
router.get('/', auth, authorize('admin', 'faculty'), resultController.getAllResults);
router.delete('/:id', auth, authorize('admin'), resultController.deleteResult);

module.exports = router;
