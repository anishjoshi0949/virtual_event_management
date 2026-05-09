// src/services/emailService.js

const sendWelcomeEmail = async (to, name) => {
  // Email integration can be added later (Nodemailer/Mailtrap)
  console.log(`Welcome email sent to ${name} at ${to}`);
};

const sendEventConfirmationEmail = async (to, name, event) => {
  // Email integration can be added later (Nodemailer/Mailtrap)
  console.log(`Confirmation email sent to ${name} at ${to} for event ${event.title}`);
};

module.exports = { sendWelcomeEmail, sendEventConfirmationEmail };