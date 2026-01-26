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
    console.log(name,email,password)

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
      { expiresIn: "1d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1 * 34 * 60 * 60 * 1000, // 1 hour
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
    console.log(user,"----------------") 
    res.status(200).json({ 
      userId:user._id,
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
    const tierSpreadsheetLimit = { Free: 1, Basic: 3, Pro: Infinity };
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
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const { spreadsheetId, name } = req.body;
    const cleanName = name?.trim();

    if (!spreadsheetId || !cleanName) {
      return res.status(400).json({
        message: "Spreadsheet ID and name are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const tier = (user.subscription?.tier || "free").toLowerCase();
    const limits = { free: 1, basic: 3, pro: Infinity };
    const limit = limits[tier];

    user.spreadsheets = user.spreadsheets || [];

    // 🚫 Free plan restriction
    if (tier === "free" && user.spreadsheets.length >= 1) {
      return res.status(403).json({
        message: "Free plan allows only 1 spreadsheet",
      });
    }

    // limit check
    if (user.spreadsheets.length >= limit) {
      return res.status(403).json({
        message: `Spreadsheet limit reached for ${tier} plan`,
      });
    }

    const normalizedName = cleanName.toLowerCase();

    const exists = user.spreadsheets.find(
      (s) =>
        s.spreadsheetId === spreadsheetId ||
        s.spreadsheetName?.toLowerCase() === normalizedName
    );

    if (exists) {
      return res.status(400).json({
        message: "Spreadsheet ID or name already exists",
      });
    }

    user.spreadsheets.push({
      spreadsheetId,
      spreadsheetName: cleanName,
      connectedAt: new Date(),
    });

    await user.save();

    res.status(201).json({
      message: "Spreadsheet added successfully",
      spreadsheets: user.spreadsheets,
    });
  } catch (error) {
    console.error("Failed to add spreadsheet:", error);
    res.status(500).json({
      message: "Failed to add spreadsheet",
    });
  }
};


export const updateSpreadsheet = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const { index, spreadsheetId, name } = req.body;
    const cleanName = name?.trim();

    if (index === undefined || index === null) {
      return res.status(400).json({
        message: "Spreadsheet index is required",
      });
    }

    if (!spreadsheetId || !cleanName) {
      return res.status(400).json({
        message: "Spreadsheet ID and name are required",
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.spreadsheets?.length) {
      return res.status(404).json({ message: "No spreadsheets found" });
    }

    if (!user.spreadsheets[index]) {
      return res.status(404).json({ message: "Spreadsheet not found" });
    }

    const normalizedName = cleanName.toLowerCase();

    const duplicate = user.spreadsheets.find(
      (s, i) =>
        i !== index &&
        (s.spreadsheetId === spreadsheetId ||
          s.spreadsheetName?.toLowerCase() === normalizedName)
    );

    if (duplicate) {
      return res.status(400).json({
        message: "Spreadsheet ID or name already exists",
      });
    }

    user.spreadsheets[index] = {
      spreadsheetId,
      spreadsheetName: cleanName,
      connectedAt: new Date(),
    };

    await user.save();

    res.status(200).json({
      message: "Spreadsheet updated successfully",
      spreadsheets: user.spreadsheets,
    });
  } catch (error) {
    console.error("Failed to update spreadsheet:", error);
    res.status(500).json({
      message: "Failed to update spreadsheet",
    });
  }
};
