const router = require('express').Router();
const postController = require('../controllers/post.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { postImages } = require('../middlewares/upload.middleware');
const cacheMiddleware = require('../middlewares/cache.middleware');

router.get('/', cacheMiddleware(300), postController.index);
router.get('/my-posts', authenticate, postController.myPosts);
router.post('/notifications/read-all', authenticate, postController.markNotificationsRead);
router.get('/create', authenticate, postController.showCreate);
router.post('/create', authenticate, postImages, postController.create);
router.get('/:id/edit', authenticate, postController.showEdit);
router.put('/:id/edit', authenticate, postImages, postController.update);   // POST (form doesn't support PUT)
router.delete('/:id/delete', authenticate, postController.delete);
router.get('/:slug', postController.show);

module.exports = router