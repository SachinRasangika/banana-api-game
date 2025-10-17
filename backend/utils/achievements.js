const achievements = {
  FIRST_PUZZLE: {
    id: 'first-puzzle',
    name: 'First Steps',
    description: 'Complete your first puzzle',
    icon: '🎯',
    condition: (user) => user.missionsCompleted >= 1
  },
  TEN_PUZZLES: {
    id: 'ten-puzzles',
    name: 'On a Roll',
    description: 'Complete 10 puzzles',
    icon: '🔥',
    condition: (user) => user.missionsCompleted >= 10
  },
  FIFTY_PUZZLES: {
    id: 'fifty-puzzles',
    name: 'Master Solver',
    description: 'Complete 50 puzzles',
    icon: '⭐',
    condition: (user) => user.missionsCompleted >= 50
  },
  PERFECT_STREAK: {
    id: 'perfect-streak',
    name: 'Perfect Accuracy',
    description: 'Get 5 correct answers in a row',
    icon: '💯',
    condition: (user) => {
      if (!user.progressHistory || user.progressHistory.length < 5) return false;
      const last5 = user.progressHistory.slice(-5);
      return last5.every(p => p.correct);
    }
  },
  KNIGHT_RANK: {
    id: 'knight-rank',
    name: 'Rise of the Knight',
    description: 'Reach Knight rank',
    icon: '⚔️',
    condition: (user) => user.rank === 'Knight' || ['Warrior', 'Champion', 'Legend'].includes(user.rank)
  },
  WARRIOR_RANK: {
    id: 'warrior-rank',
    name: 'Warrior\'s Path',
    description: 'Reach Warrior rank',
    icon: '🛡️',
    condition: (user) => user.rank === 'Warrior' || ['Champion', 'Legend'].includes(user.rank)
  },
  CHAMPION_RANK: {
    id: 'champion-rank',
    name: 'Champion\'s Glory',
    description: 'Reach Champion rank',
    icon: '👑',
    condition: (user) => user.rank === 'Champion' || user.rank === 'Legend'
  },
  LEGEND_RANK: {
    id: 'legend-rank',
    name: 'Living Legend',
    description: 'Reach Legend rank',
    icon: '✨',
    condition: (user) => user.rank === 'Legend'
  },
  THOUSAND_POINTS: {
    id: 'thousand-points',
    name: 'Milestone Reached',
    description: 'Earn 1000 points',
    icon: '💰',
    condition: (user) => user.points >= 1000
  },
  FIVE_THOUSAND_POINTS: {
    id: 'five-thousand-points',
    name: 'Point Master',
    description: 'Earn 5000 points',
    icon: '🏆',
    condition: (user) => user.points >= 5000
  }
};

function checkAndAwardAchievements(user) {
  const earnedAchievements = [];

  for (const [key, achievement] of Object.entries(achievements)) {
    const hasAchievement = user.achievements && user.achievements.some(a => a.id === achievement.id);
    
    if (!hasAchievement && achievement.condition(user)) {
      earnedAchievements.push(achievement);
      
      if (!user.achievements) {
        user.achievements = [];
      }
      
      user.achievements.push({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        earnedAt: new Date()
      });

      if (!user.profile.badges) {
        user.profile.badges = [];
      }
      if (!user.profile.badges.includes(achievement.name)) {
        user.profile.badges.push(achievement.name);
      }
    }
  }

  return earnedAchievements;
}

module.exports = { achievements, checkAndAwardAchievements };
