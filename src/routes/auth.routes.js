const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/login', authController.showLogin);
router.post('/login', validate.validateLogin, authController.login);
router.get('/register', authController.showRegister);
router.post('/register', validate.validateRegister, authController.register);
router.post('/logout', authenticate, authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.get('/resend-verification', authController.showResendVerification);
router.post('/resend-verification', authController.resendVerification);
router.get('/forgot-password', authController.showForgotPassword);
router.put('/forgot-password', validate.validateForgotPassword, authController.forgotPassword);
router.get('/reset-password', authController.showResetPassword);
router.put('/reset-password', validate.validateResetPassword, authController.resetPassword);
router.patch('/change-password', authenticate, validate.validateChangePassword, authController.changePassword);

module.exports = router;