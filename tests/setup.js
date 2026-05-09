// tests/setup.js
// Shared test setup: load env, mock email service to avoid real sends

require("dotenv").config({ path: ".env.test" });

// Mock nodemailer so tests never send real emails
jest.mock("../src/services/emailService", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendEventConfirmationEmail: jest.fn().mockResolvedValue(true),
}));
