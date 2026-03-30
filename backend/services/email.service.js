const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER.includes('@')) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } catch (err) {
    console.log('⚠️ Email transporter creation failed:', err.message);
    transporter = null;
  }
} else {
  console.log('⚠️ Email credentials not configured. Email notifications will be skipped.');
}

exports.sendOrderStatusEmail = async (to, orderId, status, orderDetails) => {
  if (!transporter) {
    console.log('Email service not available – skipping.');
    return;
  }
  const subject = `Zling: Order #${orderId} Status Updated`;
  const html = `
    <h2>Your order status has been updated</h2>
    <p>Order #${orderId} is now <strong>${status.replace('_', ' ')}</strong>.</p>
    <h3>Order Summary:</h3>
    <ul>
      ${orderDetails.items.map(item => `<li>${item.quantity} x ${item.name} - ₹${item.price * item.quantity}</li>`).join('')}
    </ul>
    <p><strong>Total: ₹${orderDetails.totalAmount}</strong></p>
    <p>Thank you for using Zling!</p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html
  });
};