// src/controllers/user.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import  User  from "../models/Users.js";
import dotenv from "dotenv"
dotenv.config()

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      subscription: { tier: "Free", startDate: new Date(), invoicesUploaded: 0, spreadsheetLimit: 1 },
    });

    res.status(201).json({ message: "User registered successfully", userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        email: user.email,
        token
      },
    });
  } catch (err) {
    console.error("Login failed:", err);
    return res.status(500).json({ message: "Login failed" });
  }
};

// Get current user info
export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user; 
    res.status(200).json({ 
      name: user.name,
      email: user.email,
      subscription: user.subscription,
      spreadsheets: user.spreadsheets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user info", error: error.message });
  }
};

// Upgrade subscription
export const upgradeSubscription = async (req, res) => {
  try {
    const user = req.user;
    const { tier, durationInMonths } = req.body; // e.g., tier = "Pro", durationInMonths = 1

    const validTiers = ["Free", "Basic", "Pro"];
    if (!validTiers.includes(tier)) return res.status(400).json({ message: "Invalid tier" });

    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(now.getMonth() + (durationInMonths || 1));

    // Update subscription
    user.subscription.tier = tier;
    user.subscription.startDate = now;
    user.subscription.endDate = endDate;

    // Update spreadsheet limit based on tier
    const tierSpreadsheetLimit = { Free: 1, Basic: 2, Pro: 5 };
    user.subscription.spreadsheetLimit = tierSpreadsheetLimit[tier] || 1;

    await user.save();

    res.status(200).json({ message: `Subscription upgraded to ${tier}`, subscription: user.subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to upgrade subscription", error: error.message });
  }
};

// Add a new spreadsheet
export const addSpreadsheet = async (req, res) => {
  try {
    const user = req.user;
    const { spreadsheetId } = req.body;

    if (!spreadsheetId) return res.status(400).json({ message: "Spreadsheet ID is required" });

    // Check spreadsheet limit
    if (user.spreadsheets.length >= user.subscription.spreadsheetLimit) {
      return res.status(403).json({
        message: `Spreadsheet limit reached for ${user.subscription.tier} tier. Upgrade to add more.`,
      });
    }

    // Add spreadsheet
    user.spreadsheets.push({ spreadsheetId, connectedAt: new Date() });
    await user.save();

    res.status(200).json({ message: "Spreadsheet added successfully", spreadsheets: user.spreadsheets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add spreadsheet", error: error.message });
  }
};
