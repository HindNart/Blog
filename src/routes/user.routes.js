const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { avatar: avatarUpload } = require('../middlewares/upload.middleware');

router.get('/profile', authenticate, userController.showProfile);
router.put('/avatar', authenticate, avatarUpload, userController.updateAvatar);
router.delete('/avatar', authenticate, userController.removeAvatar);
router.delete('/delete-account', authenticate, userController.deleteAccount);

module.exports = router;