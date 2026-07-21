const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email. Non-blocking — errors are logged, not thrown.
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'HackForge <noreply@hackforge.dev>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error.message);
  }
};

module.exports = sendEmail;
