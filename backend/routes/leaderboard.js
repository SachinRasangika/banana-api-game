const express = require('express');
const User = require('../models/User');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Get leaderboard (top players)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topPlayers = await User.find({})
      .select('username points rank missionsCompleted profile')
      .sort({ points: -1 })
      .limit(limit);

    const leaderboard = topPlayers.map((player, index) => ({
      position: index + 1,
      userId: player._id,
      username: player.username || 'Anonymous',
      points: player.points,
      rank: player.rank,
      missionsCompleted: player.missionsCompleted,
      avatar: player.profile?.avatarColor || '#3498db',
    }));

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user's leaderboard position
router.get('/position', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const position = await User.countDocuments({ points: { $gt: user.points } });

    res.json({
      success: true,
      position: position + 1,
      username: user.username,
      points: user.points,
      rank: user.rank,
      missionsCompleted: user.missionsCompleted,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get leaderboard by rank
router.get('/by-rank/:rank', async (req, res) => {
  try {
    const { rank } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const players = await User.find({ rank })
      .select('username points rank missionsCompleted profile')
      .sort({ points: -1 })
      .limit(limit);

    const leaderboard = players.map((player, index) => ({
      position: index + 1,
      userId: player._id,
      username: player.username || 'Anonymous',
      points: player.points,
      rank: player.rank,
      missionsCompleted: player.missionsCompleted,
      avatar: player.profile?.avatarColor || '#3498db',
    }));

    res.json({ success: true, leaderboard, rank });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = { router };
