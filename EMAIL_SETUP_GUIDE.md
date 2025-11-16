# 📧 Email Setup Guide for MediAccessHub

## Current Status

The application is currently running in **DEVELOPMENT MODE** where:
- ✅ Email verification and password reset features are **fully functional**
- ✅ Instead of sending real emails, the system logs the verification/reset links to the **backend console**
- ✅ You can click the links directly from the console to verify emails or reset passwords
- ✅ This is perfect for development and testing without needing real email credentials

## How to Use in Development Mode

### When a user registers or requests password reset:

1. **Check the backend console** (where you ran `npm start`)
2. Look for a message like this:

```
================================================================================
📧 EMAIL VERIFICATION (Development Mode)
================================================================================
To: user@example.com
Subject: Verify Your MediAccessHub Account

🔗 CLICK HERE TO VERIFY: http://localhost:3000/verify-email/abc123token...

Token: abc123token...
================================================================================
```

3. **Click the link** or copy-paste it into your browser
4. The verification/reset will work perfectly!

## Setting Up Real Email (Gmail) - Optional

If you want to send **real emails** to users, follow these steps:

### Step 1: Get Gmail App Password

1. **Enable 2-Step Verification** on your Gmail account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update Configuration

Edit `/app/backend/config.env`:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

**Replace:**
- `your-actual-email@gmail.com` with your Gmail address
- `your-16-character-app-password` with the password from Step 1

### Step 3: Restart Backend

```bash
cd app/backend
npm start
```

### Step 4: Test

Now emails will be sent to real email addresses! 🎉

## Email Features

### 1. Email Verification
**When:** User registers a new account
**Action:** Sends verification email with 24-hour expiry link
**Purpose:** Confirm email ownership

### 2. Password Reset
**When:** User clicks "Forgot Password"
**Action:** Sends reset email with 1-hour expiry link
**Purpose:** Secure password recovery

### 3. Doctor Registration
**When:** Doctor signs up
**Action:** Sends verification email + requires admin approval
**Purpose:** Two-step verification for healthcare professionals

## Alternative Email Providers

### Using Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Using SendGrid (Recommended for Production)

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### Using Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASS=your-mailgun-password
```

## Troubleshooting

### Issue: "Invalid login" error

**Solution:** 
- Make sure you're using an App Password (not your regular Gmail password)
- App Passwords only work if 2-Step Verification is enabled

### Issue: Emails not arriving

**Solution:**
- Check spam folder
- Verify EMAIL_USER and EMAIL_PASS in config.env
- Make sure port 587 is not blocked by firewall
- Try port 465 with `secure: true` in email.js

### Issue: "Connection timeout"

**Solution:**
- Check internet connection
- Verify EMAIL_HOST is correct
- Some networks block SMTP ports - try different network

## Development Tips

### For Testing (Current Setup - Recommended)

✅ **Keep using Development Mode:**
- No email configuration needed
- Instant testing with console links
- Perfect for development and demos
- No email rate limits or costs

### For Production

📧 **Set up real email service:**
- Use a dedicated email service (SendGrid, Mailgun, AWS SES)
- More reliable than Gmail for production
- Better delivery rates
- Email analytics and tracking

## Email Templates

The application sends beautiful HTML emails with:
- ✅ Professional design with gradient headers
- ✅ Responsive layout
- ✅ Clear call-to-action buttons
- ✅ Security information
- ✅ Company branding

You can customize email templates in:
`/app/backend/utils/email.js`

## Security Features

- ✅ **Secure Tokens:** 32-byte random hex tokens
- ✅ **Expiration:** 24h for verification, 1h for password reset
- ✅ **One-time Use:** Tokens are invalidated after use
- ✅ **HTTPS Ready:** Works with SSL/TLS
- ✅ **No Plain-text Passwords:** Never sent via email

## Testing Checklist

### Email Verification Flow
- [ ] Register new patient account
- [ ] Check console for verification link
- [ ] Click link to verify email
- [ ] Confirm "Email verified" success page
- [ ] Log in successfully

### Password Reset Flow
- [ ] Click "Forgot Password" on login page
- [ ] Enter email address
- [ ] Check console for reset link
- [ ] Click link to reset password
- [ ] Enter new password
- [ ] Confirm success message
- [ ] Log in with new password

### Doctor Registration Flow
- [ ] Register as doctor
- [ ] Check console for verification link
- [ ] Verify email
- [ ] Try to log in (should show "pending approval")
- [ ] Admin approves doctor
- [ ] Log in successfully

## FAQ

**Q: Do I need to set up email to use the application?**
A: No! Development mode works perfectly without any email configuration. All links appear in the console.

**Q: Can I use any email provider?**
A: Yes! Gmail, Outlook, SendGrid, Mailgun, AWS SES, etc. Just update the SMTP settings.

**Q: Is development mode secure?**
A: For testing, yes. But for production, use real email to ensure users receive their links.

**Q: How do I switch from development to production mode?**
A: Simply add valid email credentials to config.env and restart the backend.

**Q: Can I disable email verification?**
A: Not recommended for security, but you can modify the code to auto-verify users.

## Support

For issues or questions:
1. Check the console for error messages
2. Verify all configuration values
3. Review this guide
4. Check the backend logs for detailed error info

---

**Last Updated:** November 5, 2025
**Status:** ✅ Working in Development Mode
**Production Ready:** Pending email configuration

