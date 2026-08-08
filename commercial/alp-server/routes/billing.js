const express = require('express');
const { middleware } = require('../controllers/AuthController');

const router = express.Router();

router.use(middleware.auth);

const PRICES = {
  pro: { monthly: 19, annual: 199, seats: 5 },
  enterprise: { monthly: null, annual: null, custom: true },
};

router.get('/subscription', (req, res) => {
  res.json({ prices: PRICES, currentPlan: 'pro' });
});

router.post('/checkout', (req, res) => {
  res.json({ checkoutUrl: 'https://checkout.stripe.com/pay/alp-pro' });
});

module.exports = router;
