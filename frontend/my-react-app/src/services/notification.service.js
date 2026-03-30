const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email transporter (example using Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Twilio client
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

exports.sendEmail = async (to, subject, html) => {
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
};

exports.sendSMS = async (to, message) => {
  await twilioClient.messages.create({ body: message, from: process.env.TWILIO_PHONE, to });
};