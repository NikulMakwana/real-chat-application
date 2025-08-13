const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT token
exports.generateToken = (userId, username) => {
  return jwt.sign(
    { 
      userId, 
      username,
      iat: Math.floor(Date.now() / 1000) // issued at
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

// Validate password strength
exports.validatePassword = (password) => {
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  
  // Add more validation as needed
  // Example: require numbers, special characters, etc.
  return true;
};

// Authentication middleware
exports.authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Authentication required');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Authentication failed',
      message: error.message
    });
  }
};

// Authorization middleware (check if user owns the resource)
exports.authorize = (req, res, next) => {
  if (req.params.id !== req.user.userId) {
    return res.status(403).json({ 
      error: 'Unauthorized',
      message: 'You are not authorized to perform this action'
    });
  }
  next();
};