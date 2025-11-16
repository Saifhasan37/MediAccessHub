# MediAccessHub - Healthcare Management System

## Overview
MediAccessHub is a comprehensive healthcare management system that connects patients, doctors, and administrators in a seamless digital platform. The system provides appointment scheduling, medical records management, monitoring, and administrative features.

## Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
- [Admin Credentials](#admin-credentials)
- [User Roles](#user-roles)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)

## Features

### Patient Portal
- Book appointments with available doctors
- View appointment history and status
- Access medical records
- Update profile information
- Receive notifications

### Doctor Portal
- Manage appointments and schedules
- View patient medical records
- Create and update medical records
- Set availability
- Access analytics and charts
- Manage patient information

### Admin Portal
- User management (patients, doctors, monitors)
- Approve/reject doctor registrations
- System monitoring and analytics
- Appointment oversight
- Performance monitoring
- User activity tracking

### Monitor Portal
- Real-time login statistics
- Appointment analytics
- Export patient records (PDF/CSV)
- System activity monitoring
- Custom reporting

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MediAccessHub
```

2. Install backend dependencies:
```bash
cd app/backend
npm install
```

3. Install frontend dependencies:
```bash
cd app/frontend
npm install
```

4. Configure environment variables:
   - Copy `app/backend/config.env.example` to `app/backend/config.env`
   - Update the MongoDB connection string and other settings

5. Start the application:

**Using the startup script (recommended):**
```bash
chmod +x start-app.sh
./start-app.sh
```

**Or manually:**

Backend:
```bash
cd app/backend
npm start
```

Frontend (in a new terminal):
```bash
cd app/frontend
npm start
```

6. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Admin Credentials

### Main Administrator Account

For testing and accessing admin functionalities:

**Email:** `admin@example.com`  
**Password:** `adminpass123`

**Important Notes:**
- This is the main administrator account with full system access
- Use this account to manage users, approve doctor registrations, and monitor system activity
- **DO NOT** use this account in production without changing the password
- For security reasons, change the default password after initial setup

### Admin Capabilities:
- Manage all users (patients, doctors, monitors)
- Approve/reject doctor registrations
- View system analytics and performance metrics
- Monitor login activity and appointments
- Access all system settings
- Export data and generate reports

### Accessing Admin Dashboard:
1. Navigate to http://localhost:3000/login
2. Enter the admin credentials above
3. You will be redirected to the Admin Dashboard automatically
4. Or click the "Admin test" quick login button on the login page

## User Roles

### 1. Patient
- **Registration:** Self-registration available (no approval required)
- **Features:** Book appointments, view medical records, manage profile
- **Test Account:** 
  - Email: `patient1@example.com`
  - Password: `patientpass123`

### 2. Doctor
- **Registration:** Requires admin approval after registration
- **Features:** Manage schedules, view/create medical records, manage patients
- **Test Account:** 
  - Email: `doctor1@example.com`
  - Password: `doctorpass123`

### 3. Admin
- **Registration:** Cannot self-register (security measure)
- **Features:** Full system access, user management, system monitoring
- **Access:** Use the credentials provided above

### 4. Monitor
- **Registration:** Created by administrators
- **Features:** View analytics, export records, monitor system activity
- **Test Account:** 
  - Email: `monitor_1761760389@example.com`
  - Password: `monitor123`

## Testing

### Quick Test Logins
The login page includes quick test buttons for easy access to different user roles:
- **Admin test** - Logs in as administrator
- **Doctor test** - Logs in as doctor
- **Patient test** - Logs in as patient
- **Monitor test** - Logs in as monitor

### Testing Guide
For detailed testing instructions, see [TESTING_GUIDE.md](TESTING_GUIDE.md)

### Running Tests
```bash
# Backend tests
cd app/backend
npm test

# Frontend tests
cd app/frontend
npm test
```

## Project Structure

```
MediAccessHub/
├── app/
│   ├── backend/
│   │   ├── controllers/       # API controllers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Authentication & authorization
│   │   ├── utils/             # Utility functions
│   │   └── server.js          # Express server
│   └── frontend/
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── contexts/      # React contexts (Auth, etc.)
│       │   ├── pages/         # Page components
│       │   ├── services/      # API services
│       │   ├── types/         # TypeScript types
│       │   └── utils/         # Utility functions
│       └── public/            # Static assets
├── start-app.sh               # Startup script
├── README.md                  # This file
└── TESTING_GUIDE.md          # Testing documentation
```

## Technologies Used

### Frontend
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Toastify** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **PDFKit** - PDF generation
- **json2csv** - CSV export

## Key Features Implementation

### Notifications System
All dashboards include dismissable notifications:
- Click the X button to remove individual notifications
- Notifications show system updates and important information
- Real-time notification updates

### Doctor Approval System
- Doctors must be approved by admin after registration
- Pending registrations show in Admin Dashboard
- Admins can approve or reject applications
- See [DOCTOR_APPROVAL_SYSTEM.md](DOCTOR_APPROVAL_SYSTEM.md) for details

### Monitoring & Reports
- Real-time login statistics
- Appointment analytics
- Patient record exports (PDF/CSV)
- System performance monitoring
- See [MONITORING_SYSTEM_IMPLEMENTATION.md](MONITORING_SYSTEM_IMPLEMENTATION.md)

### Security Features
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Protected API routes
- Secure session management

## Database Seeding

To populate the database with test data:

```bash
cd app/backend
node seed-database.js
```

This will create:
- Admin account (credentials listed above)
- Sample doctors
- Sample patients
- Sample appointments
- Sample medical records
- Sample schedules

## API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: Configure in environment variables

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

#### Medical Records
- `GET /api/records` - Get medical records
- `POST /api/records` - Create record
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record

#### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get system statistics
- `POST /api/admin/approve-doctor/:id` - Approve doctor
- `POST /api/admin/reject-doctor/:id` - Reject doctor

#### Monitoring
- `GET /api/monitoring/login-stats` - Login statistics
- `GET /api/monitoring/appointment-stats` - Appointment stats
- `GET /api/monitoring/export/:patientId` - Export records

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in config.env
   - Verify database permissions

2. **Port Already in Use**
   - Frontend: Change port in package.json
   - Backend: Update PORT in config.env

3. **Cannot Login**
   - Verify credentials
   - Check if user exists in database
   - Ensure backend server is running

4. **Admin Features Not Available**
   - Confirm you're logged in with admin account
   - Check user role in database
   - Clear browser cache and cookies

## Support and Documentation

For additional documentation:
- [Startup Guide](STARTUP_GUIDE.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Admin Portal Implementation](ADMIN_PORTAL_IMPLEMENTATION.md)
- [Doctor Portal Implementation](DOCTOR_PORTAL_IMPLEMENTATION.md)
- [Monitoring System](MONITORING_SYSTEM_IMPLEMENTATION.md)
- [Doctor Approval System](DOCTOR_APPROVAL_SYSTEM.md)

## Development Team

For questions or support, contact the development team.

## License

This project is licensed under the MIT License.

---

**Note:** Remember to change default passwords and configure proper security measures before deploying to production.

