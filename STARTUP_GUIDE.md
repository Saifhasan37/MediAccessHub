# 🚀 MediAccessHub - Startup Guide

> **📖 For complete documentation including admin credentials, features, and system architecture, see [README.md](README.md)**

## Quick Start in 3 Steps

```bash
# 1. Start MongoDB
mongod

# 2. Start Backend (Terminal 1)
cd app/backend && npm start

# 3. Start Frontend (Terminal 2)
cd app/frontend && npm start
```

Then open: **http://localhost:3000**

---

## 📋 Prerequisites

Before starting, ensure you have installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js)

### Check Installed Versions:
```bash
node --version    # Should show v14.x or higher
npm --version     # Should show 6.x or higher
mongod --version  # Should show 4.4 or higher
```

---

## 🔧 First Time Setup

### Step 1: Install Dependencies

```bash
# Navigate to project root
cd MediAccessHub

# Install backend dependencies
cd app/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment

Backend configuration is in `app/backend/config.env`:

```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/mediaccesshub
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
```

**Note:** The config.env file should already exist. If not, copy from `config.env.example`

### Step 3: Seed Database (Optional)

Populate database with sample data:

```bash
cd app/backend
node seed-database.js
```

---

## 🚀 Starting the Application

### Method 1: Using the Startup Script (Recommended)

```bash
# From project root
./start-app.sh
```

This starts both backend and frontend automatically!

### Method 2: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd MediAccessHub/app/backend
npm start
```

You should see:
```
✅ Connected to MongoDB
Server running on port 5001
```

**Terminal 2 - Frontend:**
```bash
cd MediAccessHub/app/frontend
npm start
```

You should see:
```
Compiled successfully!
You can now view frontend in the browser.

Local:            http://localhost:3000
On Your Network:  http://192.168.x.x:3000
```

### Method 3: Background Processes

```bash
# Start backend in background
cd app/backend && npm start &

# Start frontend in background
cd app/frontend && npm start &
```

---

## 🔐 Test Credentials

### Patient Accounts

| Email | Password | Name |
|-------|----------|------|
| patient1@example.com | patientpass123 | Alice Williams |
| patient2@example.com | patientpass123 | Bob Johnson |
| patient3@example.com | patientpass123 | Carol Davis |

### Doctor Accounts

| Email | Password | Name | Specialization |
|-------|----------|------|----------------|
| doctor1@example.com | doctorpass123 | Dr. John Smith | General Medicine |
| doctor2@example.com | doctorpass123 | Dr. Sarah Johnson | Cardiology |
| doctor3@example.com | doctorpass123 | Dr. Michael Brown | Pediatrics |

### Admin Account

| Email | Password | Name | Role |
|-------|----------|------|------|
| admin@example.com | adminpass123 | Admin User | Administrator |

> **🔐 Important:** This is the main administrator account with full system access. Use this account to manage users, approve doctor registrations, and access all admin functionalities. See [README.md](README.md) for detailed admin capabilities.

> **⚠️ Note:** Admin accounts cannot be created through the registration page for security reasons. Use the credentials above to access admin features.

### Monitor Account

| Email | Password | Name | Role |
|-------|----------|------|------|
| monitor_1761760389@example.com | monitor123 | Mon Itor | Monitor |

---

## 🎯 Quick Test Login

### Option 1: Use Quick Login Buttons

1. Go to http://localhost:3000/login
2. Click one of these buttons:
   - **Admin test** - Login as admin
   - **Doctor test** - Login as doctor
   - **Patient test** - Login as patient
   - **Monitor test** - Login as monitor

### Option 2: Manual Login

1. Go to http://localhost:3000/login
2. Enter credentials from table above
3. Click "Sign in"

---

## 📱 Application Access

### Main Application
- **URL:** http://localhost:3000
- **Backend API:** http://localhost:5001/api

### User Dashboards

| Role | Login Redirect | URL |
|------|----------------|-----|
| Patient | Patient Dashboard | http://localhost:3000/dashboard |
| Doctor | Doctor Dashboard | http://localhost:3000/doctor-dashboard |
| Admin | Admin Dashboard | http://localhost:3000/admin-dashboard |
| Monitor | Monitoring Dashboard | http://localhost:3000/monitoring-dashboard |

---

## 🧪 Test Features

### For Patients:
1. **Book Appointments** - http://localhost:3000/book-appointment
2. **View Appointments** - http://localhost:3000/appointments
3. **View Medical Records** - http://localhost:3000/medical-records
4. **Update Profile** - http://localhost:3000/profile

### For Doctors:
1. **View Patient Appointments** - Doctor Dashboard
2. **Manage Medical Records** - http://localhost:3000/medical-records-management
3. **Set Availability** - http://localhost:3000/availability-management
4. **Update Status** - Update appointment status

### For Admins:
1. **Manage Users** - http://localhost:3000/users
2. **System Settings** - http://localhost:3000/system-settings
3. **View All Appointments** - Admin Dashboard
4. **Approve/Reject Doctors** - Admin Dashboard (Pending Doctors section)

### For Monitors:
1. **View Login Statistics** - http://localhost:3000/monitoring-dashboard
2. **View Appointment Stats** - Monitoring Dashboard
3. **Export Patient Records** - Export Records tab
4. **Real-time Monitoring** - Auto-refresh enabled

---

## 🐛 Troubleshooting

### Problem: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solution:**

**Option 1: Stop Running Process**
```bash
# Find process using port 5001
lsof -ti:5001

# Kill the process
lsof -ti:5001 | xargs kill -9

# Or for port 3000
lsof -ti:3000 | xargs kill -9
```

**Option 2: Kill All Node Processes**
```bash
pkill -f node
```

Then restart the servers.

### Problem: MongoDB Not Running

**Error:**
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# Start MongoDB
mongod

# Or on macOS with Homebrew:
brew services start mongodb-community

# Or on Linux:
sudo systemctl start mongod
```

### Problem: Dependencies Not Installed

**Error:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
# Backend
cd app/backend && npm install

# Frontend
cd app/frontend && npm install
```

### Problem: Frontend Shows Blank Page

**Solution:**
1. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Check browser console (F12) for errors
3. Verify backend is running
4. Check API URL in `app/frontend/src/services/api.ts`

### Problem: CORS Errors

**Solution:**
Already configured! Backend CORS is set to allow localhost:3000.
If you change ports, update `app/backend/server.js`:

```javascript
app.use(cors({
  origin: 'http://localhost:3000',  // Change this if needed
  credentials: true
}));
```

---

## 📊 System Health Check

### Check if Services are Running:

```bash
# Check backend
curl http://localhost:5001/api/auth/login

# Should return: {"status":"error","message":"Validation failed"}
# This means backend is running!

# Check frontend
curl http://localhost:3000

# Should return HTML
```

### Check MongoDB:

```bash
# Connect to MongoDB
mongosh

# In mongo shell:
use mediaccesshub
db.users.count()  # Should show number of users
```

---

## 🔄 Restart Everything

If something goes wrong, clean restart:

```bash
# 1. Stop all processes
pkill -f node
pkill -f mongod

# 2. Start MongoDB
mongod &

# 3. Wait 2 seconds
sleep 2

# 4. Start backend
cd app/backend && npm start &

# 5. Wait 3 seconds
sleep 3

# 6. Start frontend
cd app/frontend && npm start &

# 7. Check status
sleep 5
curl http://localhost:5001/api/auth/login
```

---

## 📝 Important URLs

### Application
- **Login:** http://localhost:3000/login
- **Register:** http://localhost:3000/register
- **Patient Dashboard:** http://localhost:3000/dashboard
- **Doctor Dashboard:** http://localhost:3000/doctor-dashboard
- **Admin Dashboard:** http://localhost:3000/admin-dashboard
- **Monitoring Dashboard:** http://localhost:3000/monitoring-dashboard

### API Endpoints
- **Backend API:** http://localhost:5001/api
- **Auth:** http://localhost:5001/api/auth
- **Users:** http://localhost:5001/api/users
- **Appointments:** http://localhost:5001/api/appointments
- **Admin:** http://localhost:5001/api/admin
- **Monitoring:** http://localhost:5001/api/monitoring

### Testing Tools
- **Test Login Page:** file:///path/to/MediAccessHub/test-login.html

---

## 🔐 Default Passwords Summary

**All Patient Passwords:** `patientpass123`  
**All Doctor Passwords:** `doctorpass123`  
**Admin Password:** `adminpass123`  
**Monitor Password:** `monitor123`

---

## 📦 Project Structure

```
MediAccessHub/
├── app/
│   ├── backend/              # Node.js/Express backend
│   │   ├── controllers/      # Route controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth middleware
│   │   ├── config.env       # Environment config
│   │   ├── server.js        # Main server file
│   │   └── package.json     # Dependencies
│   │
│   └── frontend/            # React frontend
│       ├── src/
│       │   ├── pages/       # Page components
│       │   ├── components/  # Reusable components
│       │   ├── contexts/    # React contexts
│       │   ├── services/    # API services
│       │   └── App.tsx      # Main app component
│       └── package.json     # Dependencies
│
├── start-app.sh             # Startup script
└── STARTUP_GUIDE.md         # This file
```

---

## 🎓 Learning Resources

### Documentation Files
- **README.md** - Project overview
- **DOCTOR_APPROVAL_SYSTEM.md** - Doctor approval workflow
- **MONITORING_SYSTEM_IMPLEMENTATION.md** - Monitoring features
- **LOGIN_FIX_SUMMARY.md** - Login/registration details
- **TESTING_GUIDE.md** - Testing instructions

### Example API Calls

**Login:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient1@example.com","password":"patientpass123"}'
```

**Get Current User:**
```bash
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get Appointments:**
```bash
curl http://localhost:5001/api/appointments/my-appointments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ⚡ Performance Tips

1. **Use Chrome DevTools**
   - F12 → Network tab to see API calls
   - Console tab to see errors

2. **Enable Auto-Refresh in Monitoring**
   - Go to Monitoring Dashboard
   - Check "Auto refresh" box
   - Data updates every 15 seconds

3. **Clear Cache if Slow**
   ```bash
   # Backend
   # (No cache clearing needed)
   
   # Frontend
   rm -rf app/frontend/node_modules/.cache
   ```

---

## 🔒 Security Notes

### Development Mode
- Uses simple passwords for testing
- JWT secret is basic
- No SSL/HTTPS

### For Production
1. Change all passwords
2. Update JWT_SECRET in config.env
3. Enable HTTPS
4. Add rate limiting
5. Enable email verification
6. Add two-factor authentication

---

## 📞 Support

### Common Commands

```bash
# View backend logs
cd app/backend && npm start

# View frontend logs
cd app/frontend && npm start

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log

# Clear everything and restart
rm -rf app/backend/node_modules app/frontend/node_modules
cd app/backend && npm install
cd ../frontend && npm install
```

### Getting Help

1. Check browser console (F12)
2. Check backend terminal for errors
3. Review documentation files
4. Check MongoDB is running
5. Verify ports 3000 and 5001 are free

---

## ✅ Startup Checklist

Before you start:
- [ ] MongoDB is installed
- [ ] Node.js is installed (v14+)
- [ ] npm is installed
- [ ] Dependencies installed (`npm install` in both backend and frontend)
- [ ] config.env exists in backend
- [ ] Ports 3000 and 5001 are free

Starting:
- [ ] MongoDB is running
- [ ] Backend started (port 5001)
- [ ] Frontend started (port 3000)
- [ ] Can access http://localhost:3000
- [ ] Can login with test credentials

---

## 🎉 You're Ready!

Open http://localhost:3000 and start exploring MediAccessHub!

**Quick Test:**
1. Click "Monitor test" button on login page
2. You'll be logged in as Monitor
3. View the monitoring dashboard with live statistics
4. Explore the application!

---

**Happy Testing! 🚀**

For detailed feature documentation, see the other .md files in the project root.

