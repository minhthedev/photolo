const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authController.me);

router.get('/photographers', requireAuth, requireRole('admin'), authController.listPhotographers);
router.post('/photographers', requireAuth, requireRole('admin'), authController.createPhotographer);

module.exports = router;
