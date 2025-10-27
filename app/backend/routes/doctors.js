const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const doctorController = require('../controllers/doctorController');

// Doctor-specific routes
router.get('/appointments', auth.protect, doctorController.getDoctorAppointments);
router.get('/medical-records', auth.protect, doctorController.getDoctorMedicalRecords);
router.put('/appointments/:id/status', auth.protect, doctorController.updateAppointmentStatus);
router.post('/medical-records', auth.protect, doctorController.createMedicalRecord);
router.put('/medical-records/:id', auth.protect, doctorController.updateMedicalRecord);
router.delete('/medical-records/:id', auth.protect, doctorController.deleteMedicalRecord);

module.exports = router;
