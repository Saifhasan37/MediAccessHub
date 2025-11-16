/**
 * Quick Setup Script for Test Email Service
 * This creates a FREE test email account that you can use immediately!
 * No Gmail password needed - perfect for testing!
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function setupTestEmail() {
  console.log('\n' + '='.repeat(80));
  console.log('📧 SETTING UP TEST EMAIL SERVICE');
  console.log('='.repeat(80));
  console.log('\nThis will create a FREE test email account for you!');
  console.log('Perfect for testing password reset and email verification.\n');

  try {
    // Create a test account using Ethereal
    console.log('⏳ Creating test email account...');
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('\n✅ SUCCESS! Test email account created!');
    console.log('\n' + '='.repeat(80));
    console.log('📬 YOUR TEST EMAIL CREDENTIALS');
    console.log('='.repeat(80));
    console.log(`Email: ${testAccount.user}`);
    console.log(`Password: ${testAccount.pass}`);
    console.log(`SMTP Host: ${testAccount.smtp.host}`);
    console.log(`SMTP Port: ${testAccount.smtp.port}`);
    console.log('='.repeat(80));

    // Update config.env
    const configPath = path.join(__dirname, 'config.env');
    let configContent = fs.readFileSync(configPath, 'utf8');

    // Replace email configuration
    configContent = configContent.replace(
      /EMAIL_HOST=.*/,
      `EMAIL_HOST=${testAccount.smtp.host}`
    );
    configContent = configContent.replace(
      /EMAIL_PORT=.*/,
      `EMAIL_PORT=${testAccount.smtp.port}`
    );
    configContent = configContent.replace(
      /EMAIL_USER=.*/,
      `EMAIL_USER=${testAccount.user}`
    );
    configContent = configContent.replace(
      /EMAIL_PASS=.*/,
      `EMAIL_PASS=${testAccount.pass}`
    );

    fs.writeFileSync(configPath, configContent);

    console.log('\n✅ config.env file updated automatically!');
    console.log('\n' + '='.repeat(80));
    console.log('🎯 HOW TO USE');
    console.log('='.repeat(80));
    console.log('1. Restart your backend server (Ctrl+C then npm start)');
    console.log('2. Request a password reset in your app');
    console.log('3. Check your console - you\'ll see a special preview link!');
    console.log('4. Click the preview link to see the email in your browser!');
    console.log('\nNo real email needed - just click the link in the console! 🎉');
    console.log('='.repeat(80) + '\n');

    // Save credentials to a file for reference
    const credentialsPath = path.join(__dirname, 'TEST_EMAIL_CREDENTIALS.txt');
    const credentialsText = `
TEST EMAIL CREDENTIALS
Generated: ${new Date().toLocaleString()}
==============================================

Email: ${testAccount.user}
Password: ${testAccount.pass}
SMTP Host: ${testAccount.smtp.host}
SMTP Port: ${testAccount.smtp.port}

HOW TO VIEW EMAILS:
When you send an email, check your backend console.
You'll see a special preview URL - click it to view the email!

These credentials are also saved in config.env
==============================================
`;
    fs.writeFileSync(credentialsPath, credentialsText);
    console.log(`📄 Credentials saved to: TEST_EMAIL_CREDENTIALS.txt\n`);

  } catch (error) {
    console.error('\n❌ Error setting up test email:', error.message);
    console.log('\nYou can still use Gmail - see SETUP_REAL_EMAIL.md for instructions!\n');
  }
}

// Run the setup
setupTestEmail();

