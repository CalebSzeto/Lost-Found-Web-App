const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authenticate = require('../middleware/auth');

// POST /api/auth/register - Create user profile in Firestore after Firebase Auth registration
router.post('/register', authenticate, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const { displayName } = req.body;

    // Check if user already exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return res.status(200).json({ message: 'User already exists', user: userDoc.data() });
    }

    const userData = {
      user_id: uid,
      email,
      displayName: displayName || email.split('@')[0],
      created_at: new Date().toISOString(),
    };

    await db.collection('users').doc(uid).set(userData);
    res.status(201).json({ message: 'User registered successfully', user: userData });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(userDoc.data());
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
