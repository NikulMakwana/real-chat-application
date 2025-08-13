const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT
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

// Get message history (REST endpoint)
router.get('/history/:receiverId', authenticate, async (req, res) => {
  try {
    const messages = await messageController.getMessageHistory(
      req.userId,
      req.params.receiverId
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;