# 🧪 Quick Test Guide - Email & Password Reset

## ✅ IMPORTANT: Email System is Working!

The email verification and password reset system is **fully functional** and working in **DEVELOPMENT MODE**.

Instead of sending real emails (which requires Gmail configuration), the system displays clickable links directly in your **backend console**.

## 🔍 How to Test

### Test 1: Email Verification (Patient Registration)

1. **Open the application:**
   ```
   http://localhost:3000/register
   ```

2. **Register a new patient:**
   - Name: Test Patient
   - Email: testpatient@example.com
   - Account Type: Patient
   - Fill in other required fields
   - Click "Register"

3. **Check the BACKEND CONSOLE** (where you ran `npm start` in the backend folder)

4. **You'll see something like this:**
   ```
   ================================================================================
   📧 EMAIL VERIFICATION (Development Mode)
   ================================================================================
   To: testpatient@example.com
   Subject: Verify Your MediAccessHub Account

   🔗 CLICK HERE TO VERIFY: http://localhost:3000/verify-email/abc123token...

   Token: abc123token...
   ================================================================================
   ```

5. **Click or copy the link** and open it in your browser

6. **Result:** You'll see "Email Verified Successfully!" ✅

### Test 2: Doctor Registration with Approval

1. **Register as a doctor:**
   ```
   http://localhost:3000/register
   ```
   - Account Type: Doctor
   - Add specialization, license, etc.

2. **Check backend console** for verification link

3. **Click the verification link**

4. **Try to log in** - You'll see: "Your doctor account is pending approval"

5. **Log in as admin** and approve the doctor:
   - Email: admin@mediaccess.com
   - Password: Admin@123

6. **Go to Admin Dashboard → Doctor Registrations Tab**

7. **Approve the doctor**

8. **Now the doctor can log in!** ✅

### Test 3: Forgot Password

1. **Go to login page:**
   ```
   http://localhost:3000/login
   ```

2. **Click "Forgot your password?"**

3. **Enter an email address** of an existing user (e.g., admin@mediaccess.com)

4. **Check the BACKEND CONSOLE:**
   ```
   ================================================================================
   📧 PASSWORD RESET (Development Mode)
   ================================================================================
   To: admin@mediaccess.com
   Subject: Password Reset Request - MediAccessHub

   🔗 CLICK HERE TO RESET: http://localhost:3000/reset-password/xyz789token...

   Token: xyz789token...

   ⏰ This link expires in 1 hour
   ================================================================================
   ```

5. **Click the reset link**

6. **Enter a new password** (e.g., NewPassword@123)

7. **Submit** - You'll see "Password Reset Successful!"

8. **Log in with the new password** ✅

## 📺 Visual Guide

### Where to Look for Email Links

**In your terminal/console where backend is running, you'll see:**

```
🚀 Server running on port 5001
📱 Environment: development
✅ Connected to MongoDB

POST /api/auth/register 201 455.354 ms - 1159

================================================================================
📧 EMAIL VERIFICATION (Development Mode)    <-- LOOK HERE!
================================================================================
To: user@example.com
Subject: Verify Your MediAccessHub Account

🔗 CLICK HERE TO VERIFY: http://localhost:3000/verify-email/abcd1234...
                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                         COPY THIS LINK AND OPEN IN BROWSER!

Token: abcd1234...
================================================================================
```

### Terminal/Console Location

**Mac/Linux:**
- The terminal window where you ran `cd app/backend && npm start`

**Windows:**
- The command prompt or PowerShell where you ran the backend

**VS Code:**
- The integrated terminal showing backend logs

## 🎯 Expected Behavior

### ✅ What Should Work:

1. **Patient Registration:**
   - Register → See verification link in console → Click link → Email verified → Can log in

2. **Doctor Registration:**
   - Register → See verification link in console → Click link → Email verified → Need admin approval → Admin approves → Can log in

3. **Password Reset:**
   - Forgot password → Enter email → See reset link in console → Click link → Enter new password → Can log in with new password

4. **Resend Verification:**
   - API endpoint available to resend verification emails

### ❌ What Won't Work (Until Real Email is Configured):

1. **Actual emails to real email addresses** - These require Gmail App Password setup (see EMAIL_SETUP_GUIDE.md)

2. **Email notifications to users** - Links only appear in backend console

## 🔧 Troubleshooting

### Issue: "I don't see the email links in the console"

**Solution:**
1. Make sure you're looking at the **backend** console (not frontend)
2. The backend should be running on port 5001
3. Look for messages starting with `📧 EMAIL VERIFICATION` or `📧 PASSWORD RESET`

### Issue: "The verification link doesn't work"

**Solution:**
1. Make sure you copied the **entire URL** from the console
2. The URL should look like: `http://localhost:3000/verify-email/long-token-here`
3. Make sure your frontend is running on port 3000

### Issue: "Token expired"

**Solution:**
1. Verification tokens expire after 24 hours
2. Password reset tokens expire after 1 hour
3. Register/request reset again to get a new token

## 📊 System Status

| Feature | Status | How to Use |
|---------|--------|------------|
| Email Verification | ✅ Working | Check backend console for link |
| Password Reset | ✅ Working | Check backend console for link |
| Doctor Approval | ✅ Working | Admin can approve in dashboard |
| Real Email Sending | ⏸️ Optional | Configure Gmail (see EMAIL_SETUP_GUIDE.md) |

## 🎓 For Your Teacher/Demonstration

When demonstrating the application:

1. **Show Registration:** 
   - "Here's the registration page with patient and doctor options"

2. **Show Console Logging:**
   - "In development mode, verification links appear in the backend console"
   - Show the formatted console output with the clickable link

3. **Show Verification:**
   - Click the link from console
   - Show the success page

4. **Show Doctor Approval:**
   - "Doctors need admin approval before they can log in"
   - Show the admin dashboard approval interface

5. **Show Password Reset:**
   - "Users can reset their password securely"
   - Show the forgot password flow

6. **Explain Production:**
   - "In production, these would be real emails sent to users"
   - "For development, we use console logging for faster testing"

## 💡 Pro Tips

1. **Keep backend console visible** during demos
2. **Use split screen** - Frontend on one side, backend console on the other
3. **Copy links before clicking** to show the token format
4. **Test all flows** before your presentation
5. **Have test accounts ready** for quick demos

## 📧 Want Real Emails?

If you want to set up **real email sending** (optional):

See the **EMAIL_SETUP_GUIDE.md** file for complete instructions on configuring Gmail or other email providers.

---

**Status:** ✅ All email features working in development mode
**Ready for:** Development, Testing, Demonstrations
**Next Step:** Test the features using the steps above!

