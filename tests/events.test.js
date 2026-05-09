const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/utils/prismaClient");

jest.mock("../src/services/emailService", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendEventConfirmationEmail: jest.fn().mockResolvedValue(true),
}));

describe("Events & Registration API", () => {
  let organizerToken;
  let attendeeToken;
  let createdEventId;

  beforeAll(async () => {
    // Register organizer
    await request(app).post("/api/auth/register").send({
      name: "Event Organizer",
      email: "org@test-events.com",
      password: "Secret123",
      role: "organizer",
    });
    const orgLogin = await request(app).post("/api/auth/login").send({
      email: "org@test-events.com",
      password: "Secret123",
    });
    organizerToken = orgLogin.body.data?.accessToken;

    // Register attendee
    await request(app).post("/api/auth/register").send({
      name: "Event Attendee",
      email: "att@test-events.com",
      password: "Secret123",
      role: "attendee",
    });
    const attLogin = await request(app).post("/api/auth/login").send({
      email: "att@test-events.com",
      password: "Secret123",
    });
    attendeeToken = attLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: "@test-events.com" } },
    });
    await prisma.$disconnect();
  });

  // ────── CREATE EVENT ──────
  describe("POST /api/events", () => {
    it("should create an event as organizer", async () => {
      const res = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          name: "Test Hackathon",
          place: "Bangalore",
          date: "2026-12-01",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.event.title).toBe("Test Hackathon");
      createdEventId = res.body.data.event.id;
    });

    it("should deny event creation for attendee", async () => {
      const res = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send({
          name: "Unauthorized Event",
          place: "Mumbai",
          date: "2026-12-01",
        });

      expect(res.statusCode).toBe(403);
    });

    it("should deny event creation without token", async () => {
      const res = await request(app).post("/api/events").send({
        name: "No Auth Event",
        place: "Delhi",
        date: "2026-12-01",
      });

      expect(res.statusCode).toBe(401);
    });

    it("should reject past date", async () => {
      const res = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          name: "Past Event",
          place: "Chennai",
          date: "2023-01-01",
        });

      expect(res.statusCode).toBe(400);
    });
  });

  // ────── UPDATE EVENT ──────
  describe("PUT /api/events/:id", () => {
    it("should update event as creator organizer", async () => {
      const res = await request(app)
        .put(`/api/events/${createdEventId}`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({ name: "Updated Hackathon" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.event.title).toBe("Updated Hackathon");
    });

    it("should deny update to attendee", async () => {
      const res = await request(app)
        .put(`/api/events/${createdEventId}`)
        .set("Authorization", `Bearer ${attendeeToken}`)
        .send({ name: "Unauthorized Update" });

      expect(res.statusCode).toBe(403);
    });

    it("should return 404 for non-existent event", async () => {
      const res = await request(app)
        .put("/api/events/fake-id-999")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({ name: "Ghost Event" });

      expect(res.statusCode).toBe(404);
    });
  });

  // ────── REGISTRATION ──────
  describe("POST /api/events/:id/register", () => {
    it("should register attendee for event", async () => {
      const res = await request(app)
        .post(`/api/events/${createdEventId}/register`)
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should reject duplicate registration", async () => {
      const res = await request(app)
        .post(`/api/events/${createdEventId}/register`)
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.statusCode).toBe(400);
    });

    it("should prevent organizer registering for own event", async () => {
      const res = await request(app)
        .post(`/api/events/${createdEventId}/register`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.statusCode).toBe(400);
    });
  });

  // ────── MY EVENTS ──────
  describe("GET /api/my-events", () => {
    it("should return attendee registered events", async () => {
      const res = await request(app)
        .get("/api/my-events")
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.events)).toBe(true);
      expect(res.body.data.events.length).toBeGreaterThan(0);
    });

    it("should reject without token", async () => {
      const res = await request(app).get("/api/my-events");
      expect(res.statusCode).toBe(401);
    });
  });

  // ────── CANCEL REGISTRATION ──────
  describe("DELETE /api/events/:id/register", () => {
    it("should cancel attendee registration", async () => {
      const res = await request(app)
        .delete(`/api/events/${createdEventId}/register`)
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.statusCode).toBe(200);
    });

    it("should return 404 when cancelling non-existent registration", async () => {
      const res = await request(app)
        .delete(`/api/events/${createdEventId}/register`)
        .set("Authorization", `Bearer ${attendeeToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  // ────── DELETE EVENT ──────
  describe("DELETE /api/events/:id", () => {
    it("should delete event as creator organizer", async () => {
      const res = await request(app)
        .delete(`/api/events/${createdEventId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.statusCode).toBe(200);
    });

    it("should return 404 for already deleted event", async () => {
      const res = await request(app)
        .delete(`/api/events/${createdEventId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});