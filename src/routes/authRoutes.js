const express = require("express");
const { register, login, refresh, logout } = require("../controllers/authController");
const { registerValidator, loginValidator, refreshValidator } = require("../validators/authValidator");
const { validate } = require("../middleware/validateMiddleware");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();



// POST /api/auth/register

//CREATE USER
router.post(
  "/register",
  registerValidator,   // Step 1: run validation rules
  validate,            // Step 2: check results, return 400 if any fail
  register             // Step 3: controller logic
);

// LOGIN USER
router.post(
  "/login", 
  loginValidator, 
  validate, 
  login
);

// REFRESH TOKEN
router.post(
  "/refresh", 
  refreshValidator, 
  validate, 
  refresh
);

// LOGOUT USER
router.post(
  "/logout", 
  protect, 
  logout
);



module.exports = router;