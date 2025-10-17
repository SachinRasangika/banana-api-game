const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const { router: authRouter } = require("./routes/auth");
const { router: puzzleRouter } = require("./routes/puzzle");
const { router: leaderboardRouter } = require("./routes/leaderboard");
const { router: dailyChallengeRouter } = require("./routes/dailyChallenge");

const app = express();

// Enable CORS with proper configuration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, req.body);
  next();
});

const PORT = process.env.BACKEND_PORT || 3005;

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI environment variable is not set");
  process.exit(1);
} else {
  mongoose.connect(mongoUri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  })
    .then(() => {
      console.log("✅ MongoDB Connected");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
      process.exit(1);
    });
}

app.get("/", (req, res) => res.send("API is running..."));

app.use("/api/auth", authRouter);
app.use("/api/puzzle", puzzleRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/challenges", dailyChallengeRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
