// server/index.js
// server/index.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path"); // for safe absolute paths
const caregiverRoutes = require("./routes/caregivers");
const bookingRoutes = require("./routes/booking");
const notificationRoutes = require("./routes/notifications");

// Load environment variables from .env
dotenv.config();

// Initialize Express app ✅ (must come first before app.use)
const app = express();

// =============================
// Middleware
// =============================

// Parse JSON bodies
app.use(express.json());

// Parse form data (important for multipart forms)
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Enable CORS for React frontend
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"].filter(Boolean), // your frontend URLs
    credentials: true,
  })
);

// Serve uploaded files publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =============================
// Import Routes
// =============================

// Auth routes (register, login)
const authRoutes = require(path.join(__dirname, "routes", "auth"));

// User routes (protected, e.g., profile)
const userRoutes = require(path.join(__dirname, "routes", "user"));

// Post routes
const postRoutes = require("./routes/postRoutes");

// Connection routes
const connectionRoutes = require("./routes/connections");

// Item Request routes
const itemRequestRoutes = require("./routes/itemRequests");

// Community routes
const communityRoutes = require("./routes/community");

// Campaign routes
const campaignRoutes = require("./routes/campaigns");

// =============================
// Mount Routes
// =============================
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/caregivers", caregiverRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/item-requests", itemRequestRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/campaigns", campaignRoutes);

// Debug route to test if server is working
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!", timestamp: new Date() });
});

// =============================
// MongoDB Connection
// =============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// =============================
// Start Server
// =============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
