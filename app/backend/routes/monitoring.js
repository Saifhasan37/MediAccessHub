const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const monitoringController = require('../controllers/monitoringController');

// All monitoring routes require authentication
router.use(auth.protect);

// Login statistics routes
router.get('/login-stats', monitoringController.getLoginStats);

// Appointment statistics routes
router.get('/appointment-stats', monitoringController.getAppointmentStats);

// Patient records for export routes
router.get('/patient-records', monitoringController.getPatientRecordsForExport);
router.get('/patient-records/:patientId', monitoringController.getPatientExportableRecords);

// Export routes
router.post('/export/:patientId', monitoringController.exportPatientRecords);

// Enhanced monitoring and reporting routes
router.get('/analytics', monitoringController.getSystemAnalytics);
router.post('/generate-report', monitoringController.generateCustomReport);

module.exports = router;

