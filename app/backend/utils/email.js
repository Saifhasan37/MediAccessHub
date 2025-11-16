const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate email verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create email transporter
const createTransporter = () => {
  // Check if email credentials are properly configured (not placeholder values)
  const isConfigured = 
    process.env.EMAIL_HOST && 
    process.env.EMAIL_USER && 
    process.env.EMAIL_PASS &&
    process.env.EMAIL_USER !== 'your-email@gmail.com' &&
    process.env.EMAIL_PASS !== 'your-app-password';
  
  if (isConfigured) {
    try {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } catch (error) {
      console.error('❌ Failed to create email transporter:', error.message);
      return null;
    }
  }
  
  // Development mode: log to console instead
  console.log('📧 Email system running in DEVELOPMENT MODE (console logging only)');
  return null;
};

// Send verification email
const sendVerificationEmail = async (user, token) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@mediaccess.com',
    to: user.email,
    subject: 'Verify Your MediAccessHub Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(to right, #2563eb, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(to right, #2563eb, #06b6d4); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to MediAccessHub!</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName} ${user.lastName},</h2>
            <p>Thank you for registering with MediAccessHub. To complete your registration and access all features, please verify your email address.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with MediAccessHub, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MediAccessHub. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${user.email}`);
      
      // If using Ethereal (test email), show preview URL
      if (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('ethereal.email')) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('\n' + '='.repeat(80));
          console.log('📧 EMAIL SENT! View it in your browser:');
          console.log('='.repeat(80));
          console.log(`\n🌐 PREVIEW URL: ${previewUrl}`);
          console.log(`\nTo: ${user.email}`);
          console.log(`Subject: Verify Your MediAccessHub Account`);
          console.log('\nClick the preview URL to see the email! 📬');
          console.log('='.repeat(80) + '\n');
        }
      }
    } else {
      // Development mode: log verification URL with clickable link
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL VERIFICATION (Development Mode)');
      console.log('='.repeat(80));
      console.log(`To: ${user.email}`);
      console.log(`Subject: Verify Your MediAccessHub Account`);
      console.log(`\n🔗 CLICK HERE TO VERIFY: ${verificationUrl}`);
      console.log(`\nToken: ${token}`);
      console.log('='.repeat(80) + '\n');
    }
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    // Don't fail the registration if email fails
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@mediaccess.com',
    to: user.email,
    subject: 'Password Reset Request - MediAccessHub',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(to right, #2563eb, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(to right, #2563eb, #06b6d4); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName} ${user.lastName},</h2>
            <p>We received a request to reset your password for your MediAccessHub account.</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MediAccessHub. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${user.email}`);
      
      // If using Ethereal (test email), show preview URL
      if (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('ethereal.email')) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('\n' + '='.repeat(80));
          console.log('📧 EMAIL SENT! View it in your browser:');
          console.log('='.repeat(80));
          console.log(`\n🌐 PREVIEW URL: ${previewUrl}`);
          console.log(`\nTo: ${user.email}`);
          console.log(`Subject: Password Reset Request - MediAccessHub`);
          console.log('\nClick the preview URL to see the email! 📬');
          console.log('='.repeat(80) + '\n');
        }
      }
    } else {
      // Development mode: log reset URL with clickable link
      console.log('\n' + '='.repeat(80));
      console.log('📧 PASSWORD RESET (Development Mode)');
      console.log('='.repeat(80));
      console.log(`To: ${user.email}`);
      console.log(`Subject: Password Reset Request - MediAccessHub`);
      console.log(`\n🔗 CLICK HERE TO RESET: ${resetUrl}`);
      console.log(`\nToken: ${resetToken}`);
      console.log(`\n⏰ This link expires in 1 hour`);
      console.log('='.repeat(80) + '\n');
    }
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    // Don't fail the request if email fails
    return false;
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail
};

