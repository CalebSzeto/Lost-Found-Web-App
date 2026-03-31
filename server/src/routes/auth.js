const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function createToken(user) {
  return jwt.sign(
    {
      uid: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role || 'user',
      token_version: user.token_version || 0,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register - Create user account
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      password_hash,
      displayName: (displayName || normalizedEmail.split('@')[0]).trim(),
      role: 'user',
      account_status: 'active',
      password_reset_required: false,
      token_version: 0,
      created_at: new Date().toISOString(),
    });

    const token = createToken(user);
    const userData = {
      user_id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      account_status: user.account_status,
      password_reset_required: user.password_reset_required,
      created_at: user.created_at,
    };

    res.status(201).json({ message: 'User registered successfully', token, user: userData });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login - Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.password_reset_required) {
      return res.status(403).json({
        error: 'Password reset required',
        requires_password_reset: true,
        email: user.email,
      });
    }

    const token = createToken(user);
    const userData = {
      user_id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      account_status: user.account_status,
      password_reset_required: user.password_reset_required,
      created_at: user.created_at,
    };

    res.json({ message: 'Login successful', token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user_id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      account_status: user.account_status,
      password_reset_required: user.password_reset_required,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /api/auth/reset-required - Reset password when account requires reset on login
router.post('/reset-required', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, currentPassword, and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password_reset_required) {
      return res.status(400).json({ error: 'Password reset is not required for this account' });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.password_reset_required = false;
    user.token_version = (user.token_version || 0) + 1;
    await user.save();

    return res.json({ message: 'Password reset successful. Please login again.' });
  } catch (error) {
    console.error('Reset required password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/auth/change-password - Authenticated password change for any account
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.password_reset_required = false;
    user.token_version = (user.token_version || 0) + 1;
    await user.save();

    return res.json({ message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
