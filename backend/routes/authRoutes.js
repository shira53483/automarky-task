const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/send-link', authController.sendMagicLink);
router.get('/verify/:token', authController.verifyToken);

module.exports = router;