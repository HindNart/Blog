const router = require('express').Router();
const subscriberController = require('../controllers/subscriber.controller');
const validate = require('../middlewares/validate.middleware');

router.post('/subscribe', validate.validateSubscribe, subscriberController.subscribe);
router.get('/unsubscribe', subscriberController.unsubscribe);

module.exports = router;