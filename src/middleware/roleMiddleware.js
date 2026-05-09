// src/middleware/roleMiddleware.js

/**
 * Middleware factory: Restrict access to specific roles
 * @param {...string} roles - allowed roles (e.g., "ORGANIZER")
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${roles.join(" or ")}.`,
      });
    }
    next();
  };
};

module.exports = { restrictTo };
