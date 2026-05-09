const express = require("express");
const {
  registerForEvent,
  cancelRegistration,
  getMyEvents,
  getEventParticipants,
} = require("../controllers/registrationController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");

const router = express.Router();

// POST /api/events/:id/register — attendee registers for event
router.post(
  "/:id/register",
  protect,
  registerForEvent
);

// DELETE /api/events/:id/register — attendee cancels registration
router.delete(
  "/:id/register",
  protect,
  cancelRegistration
);

// GET /api/events/:id/participants — organizer views participants
router.get(
  "/:id/participants",
  protect,
  restrictTo("ORGANIZER"),
  getEventParticipants
);

module.exports = router;