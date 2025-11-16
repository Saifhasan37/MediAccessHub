const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
  getAdminStats,
  getAdminUsers,
  getAdminAppointments,
  updateAppointmentStatus,
  deleteUser,
  approveDoctorRegistration,
  rejectDoctorRegistration,
  getPendingDoctorRegistrations,
  getSystemHealth,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  createDoctor,
  createMonitor,
  updateUser
} = require('../controllers/adminController');
const {
  getSystemInfo,
  exportSystemData,
  clearSystemCache,
  updateSystemSettings,
  getSystemLogs,
  performSystemBackup
} = require('../controllers/systemSettingsController');

const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuth);

// Admin Dashboard Routes
router.get('/stats', getAdminStats);
router.get('/system-health', getSystemHealth);

// User Management Routes
router.get('/users', getAdminUsers);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.post('/create-doctor', createDoctor);
router.post('/create-monitor', createMonitor);

// Doctor Management Routes
router.get('/pending-registrations', getPendingDoctorRegistrations);
router.get('/pending-doctors', getPendingDoctors);
router.patch('/approve-doctor/:doctorId', approveDoctor);
router.patch('/reject-doctor/:doctorId', rejectDoctor);
// Legacy routes (keep for backward compatibility)
router.patch('/approve-doctor-old/:doctorId', approveDoctorRegistration);
router.patch('/reject-doctor-old/:doctorId', rejectDoctorRegistration);

// Appointment Management Routes
router.get('/appointments', getAdminAppointments);
router.patch('/appointments/:appointmentId/status', updateAppointmentStatus);

// System Settings Routes
router.get('/system-info', getSystemInfo);
router.post('/export-data', exportSystemData);
router.post('/clear-cache', clearSystemCache);
router.put('/system-settings', updateSystemSettings);
router.get('/system-logs', getSystemLogs);
router.post('/system-backup', performSystemBackup);

module.exports = router;