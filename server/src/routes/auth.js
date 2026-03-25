const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/auth');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function createToken(user) {
  return jwt.sign(
    {
      uid: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
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
      created_at: new Date().toISOString(),
    });

    const token = createToken(user);
    const userData = {
      user_id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
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

    const token = createToken(user);
    const userData = {
      user_id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
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
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
