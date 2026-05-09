const express = require("express");
const { createEvent, updateEvent, deleteEvent } = require("../controllers/eventController");
const { createEventValidator , updateEventValidator } = require("../validators/eventValidator");
const { validate } = require("../middleware/validateMiddleware");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");

const router = express.Router();

// POST /api/events — organizer only
router.post(
  "/",
  protect,
  restrictTo("ORGANIZER"),
  createEventValidator,
  validate,
  createEvent
);

router.put(
  "/:id",
  protect,
  restrictTo("ORGANIZER"),
  updateEventValidator,
  validate,
  updateEvent
);


// DELETE /api/events/:id — organizer only
router.delete(
  "/:id",
  protect,
  restrictTo("ORGANIZER"),
  deleteEvent
);

module.exports = router;