const prisma = require("../utils/prismaClient");

const registerForEvent = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.id;

    // Find event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || !event.isActive) {
      return res.status(404).json({
        success: false,
        message: "Event not found or is no longer active.",
      });
    }

    // Organizer cannot register for own event
    if (event.organizerId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot register for your own event.",
      });
    }

    // Check duplicate registration
    const alreadyRegistered = await prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event.",
      });
    }

    // Create registration
    const registration = await prisma.registration.create({
      data: { userId, eventId },
      include: {
        event: { select: { title: true, date: true } },  // ← no time
        user: { select: { name: true, email: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Successfully registered for the event.",
      data: { registration },
    });

  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event.",
      });
    }
    next(error);
  }
};

const cancelRegistration = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.id;

    const registration = await prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    await prisma.registration.delete({
      where: { userId_eventId: { userId, eventId } },
    });

    return res.status(200).json({
      success: true,
      message: "Registration cancelled successfully.",
    });

  } catch (error) {
    next(error);
  }
};

const getMyEvents = async (req, res, next) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          include: {
            organizer: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { registeredAt: "desc" },
    });

    const events = registrations.map((r) => ({
      ...r.event,
      registeredAt: r.registeredAt,
    }));

    return res.status(200).json({
      success: true,
      count: events.length,
      data: { events },
    });

  } catch (error) {
    next(error);
  }
};

const getEventParticipants = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the event organizer can view participants.",
      });
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { registeredAt: "asc" },
    });

    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: { participants: registrations },
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyEvents,
  getEventParticipants,
};