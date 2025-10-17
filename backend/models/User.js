const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  puzzleId: String,
  correct: Boolean,
  timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  username: { type: String },
  points: { type: Number, default: 0 },
  rank: { type: String, default: 'Villager' },
  missionsCompleted: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  progressHistory: [progressSchema],
  createdAt: { type: Date, default: Date.now },
  lastPlayedAt: { type: Date },
  profile: {
    avatarColor: { type: String, default: '#3498db' },
    avatarStyle: { type: String, enum: ['circle', 'square', 'rounded'], default: 'circle' },
    bio: { type: String, default: '' },
    nickname: { type: String },
    achievements: [String],
    badges: [String],
    skinColor: { type: String, default: '#FFD700' },
    customAvatarEmoji: { type: String, default: '🧙' }
  },
  achievements: [{
    id: String,
    name: String,
    description: String,
    earnedAt: { type: Date, default: Date.now },
    icon: String
  }],
  streakDays: { type: Number, default: 0 },
  totalGameTime: { type: Number, default: 0 },
  averageAccuracy: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
