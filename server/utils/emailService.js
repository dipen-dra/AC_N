const nodemailer = require("nodemailer");

// Create transporter dynamically based on active env configurations
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If credentials are placeholder or empty, return null so we bypass and log to console
  if (!host || !user || !pass || user.includes("your-email") || pass.includes("your-app-password")) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587 or other ports
    auth: { user, pass }
  });
};

/**
 * Sends a booking update email to the customer.
 * @param {Object} booking - The booking document
 * @param {string} actionType - 'created' | 'updated' | 'cancelled'
 */
const sendBookingEmail = async (booking, actionType) => {
  try {
    const transporter = getTransporter();
    const recipient = booking.customerEmail;
    if (!recipient) return;

    let subject = "";
    let headerText = "";
    let bodyHtml = "";
    const statusText = booking.status.toUpperCase();

    if (actionType === "created") {
      subject = `🚗 Booking Confirmed: ${booking.id} — AutoCare Nepal`;
      headerText = "Booking Confirmed!";
      bodyHtml = `<p>Thank you for choosing AutoCare Nepal! Your service booking has been successfully created. Below are the details:</p>`;
    } else if (actionType === "cancelled") {
      subject = `🚨 Booking Cancelled: ${booking.id} — AutoCare Nepal`;
      headerText = "Booking Cancelled";
      bodyHtml = `<p>Your service booking has been cancelled. If this was a mistake, please book again or contact support. Below are the details of the cancelled booking:</p>`;
    } else {
      subject = `🔔 Service Status Updated: ${booking.id} — AutoCare Nepal`;
      headerText = `Booking Status: ${booking.status}`;
      bodyHtml = `<p>We have updated the progress status for your service booking. Below are the current details:</p>`;
    }

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #e11d48; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">AutoCare Nepal</h1>
          <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Professional Car Care Services</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; color: #1f2937; line-height: 1.6;">
          <h2 style="margin-top: 0; color: #111827; font-size: 20px;">${headerText}</h2>
          ${bodyHtml}
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563; width: 140px;">Booking ID:</td>
              <td style="padding: 10px 0; color: #111827;">${booking.id}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Customer:</td>
              <td style="padding: 10px 0; color: #111827;">${booking.customer} (${booking.customerEmail})</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Service Type:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${booking.service}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Vehicle Details:</td>
              <td style="padding: 10px 0; color: #111827;">${booking.vehicle}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Appointment:</td>
              <td style="padding: 10px 0; color: #111827;">📅 ${booking.date} &nbsp; ⏰ ${booking.time}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Location:</td>
              <td style="padding: 10px 0; color: #111827;">📍 ${booking.location}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Total Cost:</td>
              <td style="padding: 10px 0; color: #e11d48; font-weight: bold; font-size: 16px;">Rs. ${booking.price}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Service Status:</td>
              <td style="padding: 10px 0; color: #111827;"><span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold;">${statusText}</span></td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Mechanic:</td>
              <td style="padding: 10px 0; color: #111827;">🛠️ ${booking.technician || "-"}</td>
            </tr>
            ${booking.eta ? `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Estimated Return:</td>
              <td style="padding: 10px 0; color: #2563eb; font-weight: 600;">🕒 ${booking.eta}</td>
            </tr>` : ""}
          </table>
          
          <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px; font-size: 13px; color: #6b7280; text-align: center;">
            You can track the progress of your vehicle live on our website in the <strong>My Bookings</strong> section.
          </div>
        </div>
        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          &copy; ${new Date().getFullYear()} AutoCare Nepal. All rights reserved.<br>
          Gyaneshwor, Kathmandu, Nepal
        </div>
      </div>
    `;

    if (!transporter) {
      console.log(`\n======================================================`);
      console.log(`📧 [SMTP MOCK EMAIL LOG] to: ${recipient}`);
      console.log(`📌 Subject: ${subject}`);
      console.log(`📝 Status: ${booking.status} | Price: Rs. ${booking.price}`);
      console.log(`⚠️ SMTP environment credentials not configured in server/.env.`);
      console.log(`======================================================\n`);
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"AutoCare Nepal" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject: subject,
      html: emailTemplate
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Successful booking mail sent to ${recipient} (Action: ${actionType})`);
  } catch (error) {
    console.error("❌ Failed to send booking notification email:", error);
  }
};

/**
 * Sends a password reset token/link email to the customer.
 * @param {string} recipientEmail - Customer email
 * @param {string} token - The reset token
 */
const sendPasswordResetEmail = async (recipientEmail, token) => {
  try {
    const transporter = getTransporter();
    const subject = "🔑 Password Reset Code — AutoCare Nepal";
    
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #e11d48; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">AutoCare Nepal</h1>
        </div>
        <div style="padding: 24px; background-color: #ffffff; color: #1f2937; line-height: 1.6;">
          <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Password Reset Request</h2>
          <p>We received a request to reset the password for your AutoCare Nepal account. Use the following security code/token to set a new password:</p>
          
          <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-radius: 8px; font-family: monospace; font-size: 20px; font-weight: bold; text-align: center; letter-spacing: 2px; color: #111827; border: 1px dashed #d1d5db;">
            ${token}
          </div>
          
          <p>Alternatively, click the link below to go directly to the reset screen:</p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="http://localhost:5173/auth/reset?email=${encodeURIComponent(recipientEmail)}&token=${token}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </p>
          
          <p style="font-size: 13px; color: #6b7280;">If you didn't request a password reset, you can safely ignore this email. This token is valid for 1 hour.</p>
        </div>
        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          &copy; ${new Date().getFullYear()} AutoCare Nepal. All rights reserved.
        </div>
      </div>
    `;

    if (!transporter) {
      console.log(`\n======================================================`);
      console.log(`🔑 [SMTP MOCK PASSWORD RESET LOG] to: ${recipientEmail}`);
      console.log(`🔑 Reset Token: ${token}`);
      console.log("⚠️ SMTP environment credentials not configured.");
      console.log(`======================================================\n`);
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"AutoCare Nepal" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: emailTemplate
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
  }
};

/**
 * Sends an account status notification email (e.g. Suspended / Activated).
 * @param {string} recipientEmail - Customer email
 * @param {string} name - Customer name
 * @param {string} status - 'Active' | 'Suspended'
 */
const sendAccountStatusEmail = async (recipientEmail, name, status) => {
  try {
    const transporter = getTransporter();
    const isSuspended = status === "Suspended";
    const subject = isSuspended ? "⚠️ Account Suspended — AutoCare Nepal" : "✅ Account Activated — AutoCare Nepal";
    const headerText = isSuspended ? "Account Suspended" : "Account Reactivated";
    
    const bodyHtml = isSuspended 
      ? `<p>Dear ${name},</p><p>We regret to inform you that your AutoCare Nepal account has been <strong>Suspended</strong> by the security administration due to policy reviews or outstanding balances.</p><p>If you believe this is a mistake or wish to appeal, please reply directly to this email or contact support.</p>`
      : `<p>Dear ${name},</p><p>Great news! Your AutoCare Nepal account has been successfully <strong>Reactivated</strong>. You can now log back in, schedule automotive bookings, and manage your garage listing.</p>`;

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: ${isSuspended ? "#ef4444" : "#10b981"}; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">AutoCare Nepal</h1>
        </div>
        <div style="padding: 24px; background-color: #ffffff; color: #1f2937; line-height: 1.6;">
          <h2 style="margin-top: 0; color: #111827; font-size: 20px;">${headerText}</h2>
          ${bodyHtml}
        </div>
        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          &copy; ${new Date().getFullYear()} AutoCare Nepal. All rights reserved.
        </div>
      </div>
    `;

    if (!transporter) {
      console.log(`\n======================================================`);
      console.log(`👤 [SMTP MOCK ACCOUNT STATUS LOG] to: ${recipientEmail}`);
      console.log(`👤 Status: ${status}`);
      console.log("⚠️ SMTP environment credentials not configured.");
      console.log(`======================================================\n`);
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"AutoCare Nepal" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: emailTemplate
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Account status email sent to ${recipientEmail} (Status: ${status})`);
  } catch (error) {
    console.error("❌ Failed to send account status email:", error);
  }
};

module.exports = { sendBookingEmail, sendPasswordResetEmail, sendAccountStatusEmail };
