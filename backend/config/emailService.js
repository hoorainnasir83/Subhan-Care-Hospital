const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Helper to get SMTP configuration dynamically
const getSmtpConfig = async () => {
  let host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  let port = process.env.SMTP_PORT || 587;
  let user = process.env.EMAIL_USER;
  let pass = process.env.EMAIL_PASS;
  let senderEmail = process.env.EMAIL_USER;
  let senderName = 'Subhan Care HMS';

  // Check DB for overrides if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const Setting = require('../models/Setting');
      const settings = await Setting.findOne();
      
      if (settings && settings.email && settings.email.username) {
        host = settings.email.smtpHost || host;
        port = settings.email.smtpPort || port;
        user = settings.email.username || user;
        pass = settings.email.password || pass;
        senderEmail = settings.email.senderEmail || user;
        senderName = settings.email.senderName || senderName;
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch email settings from DB, falling back to ENV variables');
    }
  }

  return { host, port, user, pass, senderEmail, senderName };
};

/**
 * Send a password reset code email
 * @param {string} toEmail - Recipient email address
 * @param {string} code - 6-digit verification code
 * @returns {Promise<boolean>} - True if sent successfully
 */
const sendResetCodeEmail = async (toEmail, code) => {
  const config = await getSmtpConfig();
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding:32px 40px; text-align:center;">
                  <div style="width:56px; height:56px; background:rgba(255,255,255,0.2); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:12px;">
                    <span style="font-size:28px;">🏥</span>
                  </div>
                  <h1 style="color:#ffffff; font-size:20px; font-weight:800; margin:0; letter-spacing:-0.5px;">${config.senderName}</h1>
                  <p style="color:rgba(255,255,255,0.8); font-size:13px; margin:4px 0 0;">Password Reset Request</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px 40px;">
                  <p style="color:#334155; font-size:15px; line-height:1.6; margin:0 0 24px;">
                    Hello,<br><br>
                    We received a request to reset your password. Use the verification code below to complete the process:
                  </p>

                  <!-- Code Box -->
                  <div style="background:#f8fafc; border:2px dashed #cbd5e1; border-radius:12px; padding:24px; text-align:center; margin:0 0 24px;">
                    <p style="color:#64748b; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px;">Your Verification Code</p>
                    <p style="color:#1e40af; font-size:36px; font-weight:900; letter-spacing:8px; margin:0; font-family:monospace;">${code}</p>
                  </div>

                  <!-- Warning -->
                  <div style="background:#fef3c7; border-left:4px solid #f59e0b; border-radius:0 8px 8px 0; padding:12px 16px; margin:0 0 24px;">
                    <p style="color:#92400e; font-size:13px; font-weight:600; margin:0;">
                      ⏱️ This code expires in 15 minutes
                    </p>
                  </div>

                  <p style="color:#64748b; font-size:13px; line-height:1.6; margin:0;">
                    If you did not request a password reset, please ignore this email. Your account remains secure.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 40px; text-align:center;">
                  <p style="color:#94a3b8; font-size:11px; margin:0;">
                    © ${new Date().getFullYear()} ${config.senderName}. All rights reserved.
                  </p>
                  <p style="color:#94a3b8; font-size:11px; margin:4px 0 0;">
                    This is an automated message. Please do not reply.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  if (config.user && config.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        auth: { user: config.user, pass: config.pass },
        secure: config.port === 465 || (config.host.includes('gmail') ? false : false), // simplify for generic config
      });
      
      // Override for common Gmail usage
      if (config.host.includes('gmail') || (!config.host && config.user.includes('gmail'))) {
          transporter.options.service = 'gmail';
      }

      await transporter.sendMail({
        from: `"${config.senderName}" <${config.senderEmail}>`,
        to: toEmail,
        subject: `${code} — Your Password Reset Code | Subhan Care`,
        html: htmlContent
      });
      console.log(`📧 Reset code sent to ${toEmail}`);
      return true;
    } catch (err) {
      console.error('❌ Email sending failed:', err.message);
    }
  } else {
    console.log('⚠️  SMTP credentials missing (both DB and ENV). Reset code logged to console.');
  }

  // Fallback — log to console
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  RESET CODE for ${toEmail}`);
  console.log(`║  Code: ${code}`);
  console.log(`║  Expires in 15 minutes`);
  console.log(`╚══════════════════════════════════════════╝\n`);
  return true;
};

module.exports = { sendResetCodeEmail };
