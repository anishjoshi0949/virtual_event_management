const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Return the first error per field for clean output
    const formattedErrors = errors.array().reduce((acc, err) => {
      if (!acc[err.path]) {
        acc[err.path] = err.msg;
      }
      return acc;
    }, {});

    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = { validate };