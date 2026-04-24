// config/mailer.js
const nodemailer = require("nodemailer");

// Đọc config từ .env
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: SMTP_SECURE === "true", // true cho 465, false cho 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Chỉ để log xem kết nối SMTP ok không
transporter
  .verify()
  .then(() => console.log("📧 Mailer connected to SMTP server"))
  .catch((err) => console.error("❌ Mailer verify failed:", err));

module.exports = transporter;
