
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// USER MODEL
const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      phone: { type: String, required: true, unique: true }
    },
    { timestamps: true }
  )
);

// RECIPE MODEL
const Recipe = mongoose.model(
  "Recipe",
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      category: String,
      time: String,
      image: String,
      ingredients: [String],
      steps: [String]
    },
    { timestamps: true }
  )
);

// CREATE ADMIN TOKEN
function createAdminToken() {
  const payload = Buffer.from(
    JSON.stringify({ role: "admin", expires: Date.now() + 86400000 })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", process.env.ADMIN_SECRET)
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

// CHECK ADMIN ACCESS
function verifyAdmin(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Admin login required" });
  }

  try {
    const [payload, signature] = token.split(".");
    const expected = crypto
      .createHmac("sha256", process.env.ADMIN_SECRET)
      .update(payload)
      .digest("hex");

    const valid =
      signature &&
      signature.length === expected.length &&
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      );

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    if (!valid || data.role !== "admin" || data.expires < Date.now()) {
      return res.status(403).json({ message: "Invalid or expired admin login" });
    }

    next();
  } catch {
    return res.status(403).json({ message: "Invalid admin token" });
  }
}

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("RecipeHub backend is running!");
});

// USER LOGIN - SAVE NAME AND PHONE
app.post("/api/users", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const phone = req.body.phone?.trim();

    if (!name || !/^[6-9]\d{9}$/.test(phone || "")) {
      return res.status(400).json({
        message: "Enter your name and a valid 10-digit Indian phone number"
      });
    }

    const user = await User.findOneAndUpdate(
      { phone },
      { name, phone },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      message: "User saved successfully!",
      user: { name: user.name, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ message: "Could not save user" });
  }
});

// ADMIN LOGIN
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: "Incorrect admin details" });
  }

  res.json({
    message: "Admin login successful!",
    token: createAdminToken()
  });
});

// GET ALL RECIPES
app.get("/api/recipes", async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch recipes" });
  }
});

// ADD RECIPE - ADMIN ONLY
// USER LOGIN - SAVE NAME AND PHONE
// ADD RECIPE - ADMIN ONLY
app.post("/api/recipes", verifyAdmin, async (req, res) => {
  try {
    const recipe = await Recipe.create(req.body);

    res.status(201).json({
      message: "Recipe added successfully!",
      recipe
    });

  } catch (error) {
    console.error("RECIPE SAVE ERROR:", error);
    res.status(400).json({
      message: "Could not add recipe",
      error: error.message
    });
  }
});

// CONNECT TO MONGODB AND START SERVER
const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });
