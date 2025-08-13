const User = require('../models/User');
const { generateToken, validatePassword } = require('../utils/authUtils');

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate password strength
    validatePassword(password);
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
      return res.status(409).json({ 
        error: 'User exists', 
        message: `User with this ${field} already exists` 
      });
    }
    
    // Create new user
    const newUser = new User({ 
      username, 
      email, 
      password,
      profile: {
        displayName: req.body.displayName || username
      }
    });
    
    await newUser.save();
    
    // Generate JWT token
    const token = generateToken(newUser._id, newUser.username);
    
    // Set last login
    newUser.lastLogin = new Date();
    await newUser.save();
    
    res.status(201).json({ 
      user: newUser.publicProfile,
      token 
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Registration failed',
      message: error.message 
    });
  }
};

// User login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid credentials' 
      });
    }
    
    // Generate JWT token
    const token = generateToken(user._id, user.username);
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    res.json({ 
      user: user.publicProfile,
      token 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message 
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'User not found' 
      });
    }
    
    res.json(user.publicProfile);
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { displayName, bio, avatar } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'User not found' 
      });
    }
    
    // Update profile fields
    if (displayName) user.profile.displayName = displayName;
    if (bio !== undefined) user.profile.bio = bio;
    if (avatar) user.profile.avatar = avatar;
    
    await user.save();
    
    res.json(user.publicProfile);
  } catch (error) {
    res.status(500).json({ 
      error: 'Update failed',
      message: error.message 
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'User not found' 
      });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Current password is incorrect' 
      });
    }
    
    // Validate new password
    validatePassword(newPassword);
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Password change failed',
      message: error.message 
    });
  }
};