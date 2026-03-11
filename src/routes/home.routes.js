const router = require('express').Router();
const postController = require('../controllers/post.controller');
const cacheMiddleware = require('../middlewares/cache.middleware');

// Home page = post list
router.get('/', (req, res) => res.redirect('/posts'));

module.exports = router;