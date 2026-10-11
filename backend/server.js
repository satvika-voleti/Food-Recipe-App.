
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// Store only the username
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: { type: String, required: true, unique: true }
  })
);

// Test route
app.get("/", (req, res) => {
  res.send("RecipeHub backend is running!");
});

// Save username
app.post("/api/users", async (req, res) => {
  try {
    const username = req.body.username?.trim();

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const user = await User.findOneAndUpdate(
      { username },
      { username },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Username saved successfully!",
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ message: "Could not save username" });
  }
});

const PORT = process.env.PORT || 5001;

mongoose.connection.once("open", () => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
});
