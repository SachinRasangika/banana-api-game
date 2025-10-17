const EventEmitter = require('events');

class GameEventEmitter extends EventEmitter {
  emitPuzzleStarted(userId, puzzleId, timeLimit) {
    this.emit('puzzle:started', { userId, puzzleId, timeLimit, timestamp: new Date() });
  }

  emitPuzzleTimerTick(userId, puzzleId, timeRemaining) {
    this.emit('puzzle:timer:tick', { userId, puzzleId, timeRemaining, timestamp: new Date() });
  }

  emitPuzzleTimeExpired(userId, puzzleId) {
    this.emit('puzzle:time:expired', { userId, puzzleId, timestamp: new Date() });
  }

  emitPuzzleCompleted(userId, puzzleId, isCorrect, points) {
    this.emit('puzzle:completed', { userId, puzzleId, isCorrect, points, timestamp: new Date() });
  }

  emitScoreUpdated(userId, newScore) {
    this.emit('score:updated', { userId, newScore, timestamp: new Date() });
  }

  emitLevelUp(userId, newRank, previousRank) {
    this.emit('level:up', { userId, newRank, previousRank, timestamp: new Date() });
  }

  emitMissionUnlocked(userId, missionId) {
    this.emit('mission:unlocked', { userId, missionId, timestamp: new Date() });
  }

  emitAchievementEarned(userId, achievementId, achievementName) {
    this.emit('achievement:earned', { userId, achievementId, achievementName, timestamp: new Date() });
  }

  emitLeaderboardUpdated(userId) {
    this.emit('leaderboard:updated', { userId, timestamp: new Date() });
  }
}

const gameEventEmitter = new GameEventEmitter();

// Event Listeners for logging and side effects
gameEventEmitter.on('puzzle:started', (data) => {
  console.log(`[PUZZLE STARTED] User ${data.userId} started puzzle ${data.puzzleId} with ${data.timeLimit}s limit at ${data.timestamp}`);
});

gameEventEmitter.on('puzzle:timer:tick', (data) => {
  console.log(`[TIMER TICK] User ${data.userId} - Time remaining: ${data.timeRemaining}s`);
});

gameEventEmitter.on('puzzle:time:expired', (data) => {
  console.log(`[TIME EXPIRED] User ${data.userId} - Puzzle ${data.puzzleId} time limit exceeded at ${data.timestamp}`);
});

gameEventEmitter.on('puzzle:completed', (data) => {
  console.log(`[PUZZLE COMPLETED] User ${data.userId} completed puzzle ${data.puzzleId} (Correct: ${data.isCorrect}, Points: ${data.points}) at ${data.timestamp}`);
});

gameEventEmitter.on('score:updated', (data) => {
  console.log(`[SCORE UPDATED] User ${data.userId} new score: ${data.newScore} at ${data.timestamp}`);
});

gameEventEmitter.on('level:up', (data) => {
  console.log(`[LEVEL UP] User ${data.userId} promoted from ${data.previousRank} to ${data.newRank} at ${data.timestamp}`);
});

gameEventEmitter.on('mission:unlocked', (data) => {
  console.log(`[MISSION UNLOCKED] User ${data.userId} unlocked mission ${data.missionId} at ${data.timestamp}`);
});

gameEventEmitter.on('achievement:earned', (data) => {
  console.log(`[ACHIEVEMENT EARNED] User ${data.userId} earned achievement: ${data.achievementName} at ${data.timestamp}`);
});

gameEventEmitter.on('leaderboard:updated', (data) => {
  console.log(`[LEADERBOARD UPDATED] User ${data.userId} position changed at ${data.timestamp}`);
});

module.exports = gameEventEmitter;
