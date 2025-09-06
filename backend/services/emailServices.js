const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

// Transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for 587/others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test SMTP connection on startup
transporter.verify((err, success) => {
  if (err) {
    console.log("❌ Error connecting to SMTP:", err.message);
  } else {
    console.log("✅ Successfully connected to SMTP. Ready to send emails.");
  }
});

/**
 * Send OTP Email
 */
const sendOtpEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"VipChakra Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "🔐 VipChakra Verification Code",
      text: `Your VipChakra OTP code is: ${otp}. Valid for 5 minutes. Never share this with anyone.`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
            <h2 style="color: #111827;">Your VipChakra OTP Code</h2>
            <p style="font-size: 16px; color: #374151;">Please use the code below to complete your verification:</p>
            <h1 style="text-align: center; color: #2563eb; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
            <p style="font-size: 14px; color: #6b7280; margin-top: 16px;">
              This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.
            </p>
          </div>
        </div>
      `,
    });

    console.log(`📧 OTP email sent to ${email}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending OTP email:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Welcome Email for VIP Users
 */
const sendWelcomeEmailVIP = async (email, name) => {
  try {
    const info = await transporter.sendMail({
      from: `"VipChakra" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "👑 Welcome to VipChakra – Your Digital Shield",
      text: `Hello ${name || ""},

Welcome to VipChakra — the platform built to safeguard your online presence.

We monitor flagged posts, secure your profile, and protect you from digital misuse. Your reputation deserves nothing less than a shield, and VipChakra provides exactly that.

Stay protected. Stay in control.
– The VipChakra Team`,
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 32px;">
  <div style="max-width: 600px; background: white; margin: auto; padding: 32px; border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.08);">
    <h2 style="color: #1d4ed8;">👑 Welcome to VipChakra</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #111827;">
      Hello ${name || "VIP"},<br><br>
      Welcome to <strong>VipChakra</strong> — your trusted shield in the digital space.
    </p>
    <p style="font-size: 16px; color: #374151;">
      We safeguard your reputation by monitoring flagged posts, protecting your profile, and preventing misuse of your identity online.
    </p>
    <p style="font-size: 16px; color: #374151;">
      Your influence matters. Let us help you stay in control and secure.
    </p>
    <p style="font-size: 14px; color: #6b7280;">Stay protected,<br>– The VipChakra Team 🔒</p>
  </div>
</div>
`,
    });
    console.log(`📧 VIP welcome email sent to ${email}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending VIP welcome email:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Alert Email when a post/profile is flagged
 */
const sendFlagAlertEmail = async (email, flaggedItem) => {
  try {
    const info = await transporter.sendMail({
      from: `"VipChakra Alerts" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "⚠️ Alert: A post/profile has been flagged",
      text: `Hello,

A potential misuse has been detected on your account.

Flagged Item: ${flaggedItem}
Our moderation team will review this immediately.

– VipChakra Security Team`,
      html: `
<div style="font-family: Arial, sans-serif; background-color: #fef2f2; padding: 32px;">
  <div style="max-width: 600px; background: white; margin: auto; padding: 32px; border-radius: 12px; border: 1px solid #fca5a5; box-shadow: 0 6px 16px rgba(0,0,0,0.05);">
    <h2 style="color: #dc2626;">⚠️ Security Alert</h2>
    <p style="font-size: 16px; color: #111827;">
      A potential misuse has been detected on your account:
    </p>
    <div style="background: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fca5a5; margin: 16px 0;">
      <strong>Flagged Item:</strong> ${flaggedItem}
    </div>
    <p style="font-size: 16px; color: #374151;">
      Our moderation team will review this immediately. No action is required from you at this moment.
    </p>
    <p style="font-size: 14px; color: #6b7280;">Stay assured — VipChakra is protecting you.</p>
  </div>
</div>
`,
    });
    console.log(`📧 Flag alert email sent to ${email}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending flag alert email:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOtpEmail,
  sendWelcomeEmailVIP,
  sendFlagAlertEmail,
};
