const express = require('express');
const axios = require('axios');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Fetch daily challenge from OpenTrivia API
router.get('/trivia', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple&difficulty=medium');
    
    if (response.data.results.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to fetch trivia question' });
    }

    const trivia = response.data.results[0];
    
    // Decode HTML entities
    const decodeHtml = (html) => {
      const txt = document.createElement('textarea');
      txt.innerHTML = html;
      return txt.value;
    };

    const question = decodeHtml(trivia.question);
    const correctAnswer = decodeHtml(trivia.correct_answer);
    const incorrectAnswers = trivia.incorrect_answers.map(ans => decodeHtml(ans));
    
    const allAnswers = [correctAnswer, ...incorrectAnswers].sort(() => Math.random() - 0.5);
    const correctIndex = allAnswers.indexOf(correctAnswer);

    res.json({
      success: true,
      challenge: {
        id: `trivia-${Date.now()}`,
        type: 'trivia',
        category: trivia.category,
        difficulty: trivia.difficulty,
        question: question,
        answers: allAnswers,
        correctAnswerIndex: correctIndex,
        points: trivia.difficulty === 'easy' ? 100 : trivia.difficulty === 'medium' ? 200 : 300,
      }
    });
  } catch (err) {
    console.error('Error fetching trivia:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch trivia question' });
  }
});

// Fetch historical facts for flavor text
router.get('/history-fact', authMiddleware, async (req, res) => {
  try {
    // Using Wikipedia API for random historical facts
    const response = await axios.get('https://en.wikipedia.org/api/rest_v1/page/random/summary');
    
    const fact = {
      title: response.data.title,
      extract: response.data.extract,
      image: response.data.thumbnail?.source || null,
    };

    res.json({ success: true, fact });
  } catch (err) {
    console.error('Error fetching history fact:', err.message);
    // Fallback fact if API fails
    res.json({
      success: true,
      fact: {
        title: 'Ancient Kingdom',
        extract: 'Throughout history, kingdoms have risen and fallen, each leaving their mark on civilization.',
        image: null,
      }
    });
  }
});

module.exports = { router };
