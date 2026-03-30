const twilio = require('twilio');

let client = null;

// Validate Twilio credentials: accountSid must start with "AC" and have a token
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  try {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (err) {
    console.log('⚠️ Twilio client initialization failed:', err.message);
    client = null;
  }
} else {
  console.log('⚠️ Twilio credentials missing or invalid. SMS notifications will be skipped.');
}

exports.sendOrderStatusSMS = async (to, orderId, status) => {
  if (!client) {
    console.log('SMS service not available – skipping.');
    return;
  }
  const message = `Zling: Order #${orderId} is now ${status.replace('_', ' ')}. Track in app.`;
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to
  });
};