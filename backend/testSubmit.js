require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.BACKEND_PORT || 3005}`;

if (!MONGO_URI) {
  console.error('MONGO_URI is not set in environment. Please set it in .env and retry.');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    const email = 'test+automation@example.com';
    const rawPassword = 'TestPass123!';

    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await bcrypt.hash(rawPassword, 10);
      user = new User({ email, passwordHash });
      await user.save();
      console.log('Test user created:', email);
    } else {
      console.log('Test user exists:', email);
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
    console.log('\nJWT token (use for manual tests if needed):\n', token, '\n');

    // Fetch puzzles list from backend
    console.log('Fetching puzzle list from backend...');
    const listResp = await axios.get(`${BACKEND_URL}/api/puzzle/list`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!listResp.data || !listResp.data.success) {
      console.error('Failed to fetch puzzles list:', listResp.data || listResp.statusText);
      process.exit(1);
    }

    const puzzles = listResp.data.puzzles || [];
    console.log(`Found ${puzzles.length} puzzles`);

    // Prepare three test submissions: correct, incorrect, random
    const tests = [];
    if (puzzles.length >= 1) {
      const p = puzzles[0];
      tests.push({ puzzleId: p.id, answer: p.solution, desc: 'correct answer (should be correct)' });
    }
    if (puzzles.length >= 2) {
      const p = puzzles[1];
      const wrong = (typeof p.solution === 'number') ? p.solution + 1 : p.solution;
      tests.push({ puzzleId: p.id, answer: wrong, desc: 'incorrect answer (should be wrong)' });
    }
    if (puzzles.length >= 3) {
      const p = puzzles[2];
      const rnd = Math.floor(Math.random() * (p.solution + 4 || 5));
      tests.push({ puzzleId: p.id, answer: rnd, desc: 'random answer (varied outcome)' });
    }

    if (tests.length === 0) {
      console.error('No puzzles available to test.');
      process.exit(1);
    }

    for (const t of tests) {
      try {
        console.log(`\nSubmitting: puzzleId=${t.puzzleId}, answer=${t.answer} -> ${t.desc}`);
        const resp = await axios.post(`${BACKEND_URL}/api/puzzle/submit`, {
          puzzleId: Number(t.puzzleId),
          answer: Number(t.answer)
        }, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        console.log('Response status:', resp.status);
        console.log('Response data:', JSON.stringify(resp.data, null, 2));
      } catch (err) {
        if (err.response) {
          console.error('Request failed with status', err.response.status);
          console.error('Response body:', JSON.stringify(err.response.data, null, 2));
        } else {
          console.error('Request error:', err.message);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Test script error:', err);
    process.exit(1);
  }
})();
