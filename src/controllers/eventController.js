const prisma = require("../utils/prismaClient");

// ─── CREATE EVENT ─────────────────────────────────────
const createEvent = async (req, res, next) => {
  try {
    const { name, place, date } = req.body;

    const event = await prisma.event.create({
      data: {
        title: name,
        place,          // ← direct
        date,
        organizerId: req.user.id,
        // ← NO time, NO description, NO capacity
      },
      select: {
        id: true,
        title: true,
        place: true,    // ← not description
        date: true,
        createdAt: true,
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: { event },
    });

  } catch (error) {
    next(error);
  }
};

// ─── UPDATE EVENT ─────────────────────────────────────
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, place, date } = req.body;

    // 1. Check event exists
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // 2. Only the organizer who created it can update
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this event.",
      });
    }

    // 3. Only update fields that were actually sent
    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(name  && { title: name }),
        ...(place && { place }),
        ...(date  && { date }),
      },
      select: {
        id: true,
        title: true,
        place: true,
        date: true,
        updatedAt: true,
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      data: { event: updated },
    });

  } catch (error) {
    next(error);
  }
};


// ─── DELETE EVENT ─────────────────────────────────────
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Check event exists
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // 2. Only the organizer who created it can delete
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this event.",
      });
    }

    // 3. Delete
    await prisma.event.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { createEvent, updateEvent, deleteEvent };