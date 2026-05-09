const { body } = require("express-validator");

const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number."),

  body("role")
    .optional()
    .isIn(["organizer", "attendee", "ORGANIZER", "ATTENDEE"])
    .withMessage("Role must be either organizer or attendee."),
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email.")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required."),
];

const refreshValidator = [
  body("refreshToken")
    .notEmpty().withMessage("Refresh token is required."),
];

module.exports = { registerValidator, loginValidator, refreshValidator };
