const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
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

// Send notification endpoint
router.post('/send', authenticate, (req, res) => {
  try {
    const { userId, title, message } = req.body;
    
    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const success = notificationController.sendNotification(userId, {
      title,
      message,
      type: 'push'
    });
    
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check connection status
router.get('/status/:userId', authenticate, (req, res) => {
  try {
    const isConnected = notificationController.getConnectionStatus(req.params.userId);
    res.json({ userId: req.params.userId, connected: isConnected });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;