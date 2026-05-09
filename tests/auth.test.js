const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/utils/prismaClient");

jest.mock("../src/services/emailService", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendEventConfirmationEmail: jest.fn().mockResolvedValue(true),
}));

describe("Auth API", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: "@test-auth.com" } },
    });
    await prisma.$disconnect();
  });

  // ────── REGISTER ──────
  describe("POST /api/auth/register", () => {
    it("should register a new attendee", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test Attendee",
        email: "attendee@test-auth.com",
        password: "Secret123",
        role: "attendee",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe("ATTENDEE");
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it("should register a new organizer", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test Organizer",
        email: "organizer@test-auth.com",
        password: "Secret123",
        role: "organizer",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe("ORGANIZER");
    });

    it("should reject duplicate email", async () => {
      await request(app).post("/api/auth/register").send({
        name: "Dup User",
        email: "dup@test-auth.com",
        password: "Secret123",
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "Dup User",
        email: "dup@test-auth.com",
        password: "Secret123",
      });

      expect(res.statusCode).toBe(409);
    });

    it("should reject short password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Short Pass",
        email: "short@test-auth.com",
        password: "123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("should reject invalid email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Bad Email",
        email: "not-an-email",
        password: "Secret123",
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ────── LOGIN ──────
  describe("POST /api/auth/login", () => {
    beforeAll(async () => {
      await request(app).post("/api/auth/register").send({
        name: "Login Test User",
        email: "logintest@test-auth.com",
        password: "Secret123",
      });
    });

    it("should login with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "logintest@test-auth.com",
        password: "Secret123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it("should reject wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "logintest@test-auth.com",
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(401);
    });

    it("should reject non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nobody@test-auth.com",
        password: "Secret123",
      });

      expect(res.statusCode).toBe(401);
    });
  });

// ────── REFRESH ──────
describe("POST /api/auth/refresh", () => {
  let refreshToken;

  beforeAll(async () => {
    // Register fresh user specifically for refresh test
    await request(app).post("/api/auth/register").send({
      name: "Refresh Test User",
      email: "refresh@test-auth.com",
      password: "Secret123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "refresh@test-auth.com",
      password: "Secret123",
    });
    refreshToken = res.body.data?.refreshToken;
  });

  it("should return new accessToken with valid refreshToken", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("should reject invalid refreshToken", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: "invalidtoken123",
    });

    expect(res.statusCode).toBe(401);
  });

  it("should reject missing refreshToken", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.statusCode).toBe(400);
  });
});

  // ────── LOGOUT ──────
  describe("POST /api/auth/logout", () => {
    let accessToken;

    beforeAll(async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "logintest@test-auth.com",
        password: "Secret123",
      });
      accessToken = res.body.data?.accessToken;
    });

    it("should logout successfully with valid token", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject logout without token", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.statusCode).toBe(401);
    });
  });
});