const { body } = require("express-validator");

const createEventValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Event name is required.")
    .isLength({ min: 3, max: 100 }).withMessage("Event name must be between 3 and 100 characters."),

  body("place")
    .trim()
    .notEmpty().withMessage("Place is required."),

  body("date")
    .notEmpty().withMessage("Date is required.")
    .isISO8601().withMessage("Date must be a valid format (YYYY-MM-DD).")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Event date cannot be in the past.");
      }
      return true;
    }),
];

const updateEventValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("Event name cannot be empty.")
    .isLength({ min: 3, max: 100 }).withMessage("Event name must be between 3 and 100 characters."),

  body("place")
    .optional()
    .trim()
    .notEmpty().withMessage("Place cannot be empty."),

  body("date")
    .optional()
    .isISO8601().withMessage("Date must be a valid format (YYYY-MM-DD).")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Event date cannot be in the past.");
      }
      return true;
    }),
];

module.exports = { createEventValidator, updateEventValidator };