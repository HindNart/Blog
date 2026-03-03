const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');

router.get('/pending', adminController.getPendingPosts);
router.get('/approved', adminController.getApprovedPosts);
router.get('/deleted', adminController.getDeletedPosts);
router.put('/:id/approve', adminController.approvePost);
router.put('/:id/reject', adminController.rejectPost);
router.put('/:id/restore', adminController.restorePost);
router.delete('/:id/hard-delete', adminController.hardDeletePost);

module.exports = router;