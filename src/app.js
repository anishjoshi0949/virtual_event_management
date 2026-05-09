const express = require("express");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");  // ← is this line present?
const registrationRoutes = require("./routes/registrationRoutes");
const { protect } = require("./middleware/authMiddleware");
const { getMyEvents } = require("./controllers/registrationController");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);  // ← is this line present?
app.use("/api/events", registrationRoutes);   // ← registration routes

app.get("/api/my-events", protect, getMyEvents);


// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error.",
  });
});

module.exports = app;