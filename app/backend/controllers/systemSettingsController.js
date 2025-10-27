const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Schedule = require('../models/Schedule');
const MedicalRecord = require('../models/MedicalRecord');
const fs = require('fs');
const path = require('path');

// @desc    Get system information and configuration
// @route   GET /api/admin/system-info
// @access  Private/Admin
const getSystemInfo = asyncHandler(async (req, res) => {
  const systemInfo = {
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'MongoDB',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    lastBackup: new Date().toISOString(),
    totalUsers: await User.countDocuments(),
    totalAppointments: await Appointment.countDocuments(),
    totalSchedules: await Schedule.countDocuments(),
    totalRecords: await MedicalRecord.countDocuments(),
  };

  res.status(200).json({
    status: 'success',
    data: systemInfo,
  });
});

// @desc    Export system data
// @route   POST /api/admin/export-data
// @access  Private/Admin
const exportSystemData = asyncHandler(async (req, res) => {
  const { dataType, format = 'json' } = req.body;

  let exportData = {};
  let filename = '';

  switch (dataType) {
    case 'users':
      exportData = await User.find().select('-password');
      filename = `users-export-${Date.now()}.${format}`;
      break;
    case 'appointments':
      exportData = await Appointment.find()
        .populate('patient', 'firstName lastName email')
        .populate('doctor', 'firstName lastName specialization');
      filename = `appointments-export-${Date.now()}.${format}`;
      break;
    case 'schedules':
      exportData = await Schedule.find()
        .populate('createdBy', 'firstName lastName');
      filename = `schedules-export-${Date.now()}.${format}`;
      break;
    case 'medical-records':
      exportData = await MedicalRecord.find()
        .populate('patient', 'firstName lastName')
        .populate('doctor', 'firstName lastName');
      filename = `medical-records-export-${Date.now()}.${format}`;
      break;
    case 'system-log':
      // In a real application, this would read from log files
      exportData = {
        logs: [
          { timestamp: new Date(), level: 'INFO', message: 'System started' },
          { timestamp: new Date(), level: 'INFO', message: 'Database connected' },
          { timestamp: new Date(), level: 'WARN', message: 'High memory usage detected' },
        ],
      };
      filename = `system-logs-${Date.now()}.${format}`;
      break;
    default:
      res.status(400);
      throw new Error('Invalid data type for export');
  }

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportData);
  } else if (format === 'csv') {
    // Simple CSV conversion (in a real app, use a proper CSV library)
    const csvData = convertToCSV(exportData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  }
});

// @desc    Clear system cache
// @route   POST /api/admin/clear-cache
// @access  Private/Admin
const clearSystemCache = asyncHandler(async (req, res) => {
  // In a real application, this would clear various caches
  // For now, we'll simulate cache clearing
  await new Promise(resolve => setTimeout(resolve, 1000));

  res.status(200).json({
    status: 'success',
    message: 'System cache cleared successfully',
    data: {
      clearedAt: new Date().toISOString(),
      cacheTypes: ['user-sessions', 'appointment-cache', 'schedule-cache'],
    },
  });
});

// @desc    Update system settings
// @route   PUT /api/admin/system-settings
// @access  Private/Admin
const updateSystemSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  // In a real application, these settings would be stored in a database
  // For now, we'll simulate updating settings
  const updatedSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user._id,
  };

  res.status(200).json({
    status: 'success',
    message: 'System settings updated successfully',
    data: updatedSettings,
  });
});

// @desc    Get system logs
// @route   GET /api/admin/system-logs
// @access  Private/Admin
const getSystemLogs = asyncHandler(async (req, res) => {
  const { level, limit = 100 } = req.query;

  // In a real application, this would read from actual log files
  const mockLogs = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'INFO',
      message: 'User login successful',
      userId: '507f1f77bcf86cd799439011',
      ip: '192.168.1.100',
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: 'WARN',
      message: 'High memory usage detected',
      details: 'Memory usage above 80%',
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 900000).toISOString(),
      level: 'ERROR',
      message: 'Database connection timeout',
      details: 'Connection to MongoDB timed out after 30 seconds',
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      level: 'INFO',
      message: 'Appointment created',
      appointmentId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439013',
    },
  ];

  let filteredLogs = mockLogs;
  if (level) {
    filteredLogs = mockLogs.filter(log => log.level.toLowerCase() === level.toLowerCase());
  }

  res.status(200).json({
    status: 'success',
    data: {
      logs: filteredLogs.slice(0, parseInt(limit)),
      total: filteredLogs.length,
    },
  });
});

// @desc    Perform system backup
// @route   POST /api/admin/system-backup
// @access  Private/Admin
const performSystemBackup = asyncHandler(async (req, res) => {
  const { backupType = 'full' } = req.body;

  // In a real application, this would perform actual database backup
  const backupInfo = {
    backupId: `backup_${Date.now()}`,
    type: backupType,
    startedAt: new Date().toISOString(),
    status: 'in_progress',
  };

  // Simulate backup process
  setTimeout(() => {
    backupInfo.status = 'completed';
    backupInfo.completedAt = new Date().toISOString();
    backupInfo.size = '2.5 MB';
    backupInfo.location = `/backups/${backupInfo.backupId}.tar.gz`;
  }, 2000);

  res.status(200).json({
    status: 'success',
    message: 'System backup initiated',
    data: backupInfo,
  });
});

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

module.exports = {
  getSystemInfo,
  exportSystemData,
  clearSystemCache,
  updateSystemSettings,
  getSystemLogs,
  performSystemBackup,
};




