const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';

// JWT middleware
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, userId: user._id, email: user.email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const hash = user.passwordHash || user.password; // legacy support
    if (!hash) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, userId: user._id, username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Username
router.post('/update-username', async (req, res) => {
  const { username } = req.body || {};
  const token = req.headers.authorization?.slice(7);

  try {
    if (!username) return res.status(400).json({ success: false, message: 'Username is required' });
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findByIdAndUpdate(
      payload.userId,
      { username },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, username: user.username, userId: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get User Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        points: user.points,
        rank: user.rank,
        missionsCompleted: user.missionsCompleted,
        correctAnswers: user.correctAnswers,
        averageAccuracy: user.averageAccuracy,
        streakDays: user.streakDays,
        profile: user.profile,
        achievements: user.achievements,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update User Profile
router.post('/update-profile', authMiddleware, async (req, res) => {
  const { profile } = req.body || {};

  try {
    if (!profile) return res.status(400).json({ success: false, message: 'Profile data is required' });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { profile: { ...profile, badges: profile.badges || [] } },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: user.profile
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = { router, authMiddleware };
