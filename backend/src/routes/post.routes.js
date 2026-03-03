const express = require('express');
const router = express.Router();

const postController = require('../controllers/post.controller');

router.get('/search-keyword/:keyword', postController.getPostsByKeyword);
router.get('/category/:category', postController.getPostsByCategory);

router.post('/create', postController.createPost);
router.get('/:id', postController.getPostById); //
router.put('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);
router.get('/my-posts', postController.getAllPosts);

module.exports = router;