const express = require('express');
const { login, register, getProfile, middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/login', asyncHandler(login));
router.post('/register', asyncHandler(register));
router.get('/profile', middleware.auth, asyncHandler(getProfile));
router.get('/me', middleware.auth, asyncHandler(getProfile));

module.exports = router;
