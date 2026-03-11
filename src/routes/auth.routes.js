const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/register', authController.showRegister);
router.post('/register', authController.register);
router.post('/logout', authenticate, authController.logout);
router.get('/forgot-password', authController.showForgotPassword);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password', authController.showResetPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/change-password', authenticate, authController.showChangePassword);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;