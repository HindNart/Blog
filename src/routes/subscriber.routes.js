const router = require('express').Router();
const subscriberController = require('../controllers/subscriber.controller');

router.post('/subscribe', subscriberController.subscribe);
router.get('/unsubscribe', subscriberController.unsubscribe);

module.exports = router;