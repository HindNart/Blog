const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const categoryController = require('../controllers/category.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', adminController.dashboard);
router.get('/posts', adminController.allApprovedPosts);
router.get('/posts/pending', adminController.pendingPosts);
router.get('/posts/deleted', adminController.deletedPosts);
router.put('/posts/:id/approve', adminController.approvePost);
router.put('/posts/:id/reject', validate.validateRejectReason, adminController.rejectPost);
router.put('/posts/:id/restore', adminController.restorePost);
router.delete('/posts/:id/permanent-delete', adminController.permanentDelete);
router.post('/categories', categoryController.create);
router.delete('/categories/:id/delete', categoryController.delete);

module.exports = router;