const express = require('express');
const User = require('../models/User');
const gameEventEmitter = require('../utils/eventEmitter');
const { authMiddleware } = require('./auth');
const { checkAndAwardAchievements } = require('../utils/achievements');

const router = express.Router();

// Puzzle database (in production, use MongoDB collection)
const puzzles = [
  {
    id: 1,
    title: 'Banana Quest 1',
    description: 'Count the bananas in the image',
    difficulty: 'Easy',
    points: 100,
    question: 'https://www.sanfoh.com/uob/banana/data/te220a5ae4b48743784a1b79c2fn110.png',
    solution: 0,
  },
  {
    id: 2,
    title: 'Banana Quest 2',
    description: 'Count the bananas in the image',
    difficulty: 'Medium',
    points: 200,
    question: 'https://www.sanfoh.com/uob/banana/data/tda960504e718609d6c2f28d7c2n54.png',
    solution: 4,
  },
  {
    id: 3,
    title: 'Banana Quest 3',
    description: 'Count the bananas in the image',
    difficulty: 'Easy',
    points: 100,
    question: 'https://www.sanfoh.com/uob/banana/data/tde4a7bef40faff4194de5e6367n100.png',
    solution: 0,
  },
];

const ranks = ['Villager', 'Knight', 'Warrior', 'Champion', 'Legend'];
const pointsPerRank = 1000;

// Get next puzzle with difficulty progression
router.get('/next', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Difficulty progression based on rank
    let difficultyFilter = 'Easy';
    const rankToDifficulty = {
      'Villager': 'Easy',
      'Knight': ['Easy', 'Medium'],
      'Warrior': ['Medium', 'Hard'],
      'Champion': 'Hard',
      'Legend': 'Hard'
    };

    const userDifficulty = rankToDifficulty[user.rank] || 'Easy';

    // Filter puzzles by difficulty
    let availablePuzzles = puzzles;
    if (Array.isArray(userDifficulty)) {
      availablePuzzles = puzzles.filter(p => userDifficulty.includes(p.difficulty));
    } else {
      availablePuzzles = puzzles.filter(p => p.difficulty === userDifficulty);
    }

    if (availablePuzzles.length === 0) {
      availablePuzzles = puzzles;
    }

    const timeLimit = userDifficulty === 'Easy' ? 60 : userDifficulty === 'Medium' ? 50 : 40;
    const puzzle = availablePuzzles[Math.floor(Math.random() * availablePuzzles.length)];

    gameEventEmitter.emitPuzzleStarted(req.userId, puzzle.id, timeLimit);
    user.lastPlayedAt = new Date();
    await user.save();

    res.json({
      success: true,
      puzzle,
      timeLimit,
      difficulty: userDifficulty,
      userRank: user.rank,
      userPoints: user.points
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit puzzle answer
router.post('/submit', authMiddleware, async (req, res) => {
  const { puzzleId, answer } = req.body;

  try {
    if (typeof puzzleId !== 'number' || typeof answer !== 'number') {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    const puzzle = puzzles.find(p => p.id === puzzleId);
    if (!puzzle) {
      return res.status(404).json({ success: false, message: 'Puzzle not found' });
    }

    const isCorrect = answer === puzzle.solution;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Emit puzzle completed event
    gameEventEmitter.emitPuzzleCompleted(req.userId, puzzleId, isCorrect, isCorrect ? puzzle.points : 0);

    // Update user progress and points
    user.progressHistory.push({
      puzzleId: puzzleId,
      correct: isCorrect,
      timestamp: new Date(),
    });

    let earnedAchievements = [];

    if (isCorrect) {
      user.points += puzzle.points;
      user.missionsCompleted += 1;
      user.correctAnswers = (user.correctAnswers || 0) + 1;

      // Update average accuracy
      const totalAttempts = user.progressHistory.length;
      user.averageAccuracy = (user.correctAnswers / totalAttempts) * 100;

      // Emit score updated event
      gameEventEmitter.emitScoreUpdated(req.userId, user.points);

      // Check for rank upgrade
      const previousRank = user.rank;
      const newRankIndex = Math.floor(user.points / pointsPerRank);
      const updatedRankIndex = Math.min(newRankIndex, ranks.length - 1);
      const newRank = ranks[updatedRankIndex];

      if (newRank !== previousRank) {
        user.rank = newRank;
        user.profile = user.profile || {};
        user.profile.badges = user.profile.badges || [];

        if (!user.profile.badges.includes(newRank)) {
          user.profile.badges.push(newRank);
        }

        // Emit level up event
        gameEventEmitter.emitLevelUp(req.userId, newRank, previousRank);
      }

      // Check for achievements
      earnedAchievements = checkAndAwardAchievements(user);
      earnedAchievements.forEach(achievement => {
        gameEventEmitter.emitAchievementEarned(req.userId, achievement.id, achievement.name);
      });

      // Emit leaderboard update
      gameEventEmitter.emitLeaderboardUpdated(req.userId);
    }

    await user.save();

    const response = {
      success: true,
      isCorrect,
      points: isCorrect ? puzzle.points : 0,
      userPoints: user.points,
      userRank: user.rank,
      message: isCorrect ? 'Correct answer!' : `Wrong! The correct answer is ${puzzle.solution}`,
      missionsCompleted: user.missionsCompleted,
      correctAnswers: user.correctAnswers,
      averageAccuracy: user.averageAccuracy,
    };

    // Add achievement information if any were earned
    if (isCorrect && earnedAchievements.length > 0) {
      response.achievements = earnedAchievements.map(a => ({
        id: a.id,
        name: a.name,
        icon: a.icon
      }));
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get puzzle list
router.get('/list', authMiddleware, (req, res) => {
  try {
    res.json({ success: true, puzzles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = { router };
