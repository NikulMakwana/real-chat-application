const express = require('express');
const router = express.Router();
const presenceController = require('../controllers/presenceController');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Authentication required');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Get status of a specific user
router.get('/status/:userId', authenticate, (req, res) => {
  try {
    const status = presenceController.getUserStatus(req.params.userId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all online users
router.get('/online', authenticate, (req, res) => {
  try {
    const onlineUsers = presenceController.getOnlineUsers();
    res.json(onlineUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user's status
router.get('/my-status', authenticate, (req, res) => {
  try {
    const status = presenceController.getUserStatus(req.userId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;