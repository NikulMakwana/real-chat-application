const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../utils/authUtils');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes (require authentication)
router.use(authenticate);

// User profile routes
router.get('/profile/:id', userController.getProfile);
router.put('/profile/:id', authorize, userController.updateProfile);
router.put('/profile/:id/password', authorize, userController.changePassword);

// Admin routes (for future implementation)
// router.get('/users', authorizeAdmin, userController.listUsers);
// router.delete('/users/:id', authorizeAdmin, userController.deleteUser);

module.exports = router;