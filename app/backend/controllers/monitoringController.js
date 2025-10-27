const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Schedule = require('../models/Schedule');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Get login statistics
const getLoginStats = async (req, res) => {
  try {
    const { filter = 'daily' } = req.query;
    
    // Calculate date ranges based on filter
    const now = new Date();
    let startDate, endDate;
    
    switch (filter) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date();
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    // Get total users by role
    const totalUsers = await User.countDocuments();
    const patients = await User.countDocuments({ role: 'patient' });
    const doctors = await User.countDocuments({ role: 'doctor' });
    const admins = await User.countDocuments({ role: 'admin' });

    // Simulate login statistics (in a real app, you'd track actual logins)
    const loginStats = {
      totalLogins: Math.floor(Math.random() * 1000) + 500,
      dailyLogins: Math.floor(Math.random() * 50) + 20,
      weeklyLogins: Math.floor(Math.random() * 200) + 100,
      monthlyLogins: Math.floor(Math.random() * 800) + 400,
      loginsByRole: {
        patients: Math.floor(Math.random() * 300) + 150,
        doctors: Math.floor(Math.random() * 100) + 50,
        admins: Math.floor(Math.random() * 50) + 10
      },
      recentLogins: [
        {
          user: 'John Smith',
          role: 'patient',
          loginTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          ipAddress: '192.168.1.100'
        },
        {
          user: 'Dr. Sarah Johnson',
          role: 'doctor',
          loginTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          ipAddress: '192.168.1.101'
        },
        {
          user: 'Admin User',
          role: 'admin',
          loginTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          ipAddress: '192.168.1.102'
        }
      ]
    };

    res.status(200).json({
      status: 'success',
      data: loginStats
    });
  } catch (error) {
    console.error('Get login stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get appointment statistics
const getAppointmentStats = async (req, res) => {
  try {
    const { filter = 'daily' } = req.query;
    
    // Get total appointments
    const totalAppointments = await Appointment.countDocuments();
    
    // Get appointments by doctor
    const appointmentsByDoctor = await Appointment.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $unwind: {
          path: '$doctorInfo',
          preserveNullAndEmptyArrays: false // Only include appointments with valid doctor info
        }
      },
      {
        $match: {
          'doctorInfo.firstName': { $exists: true, $ne: null },
          'doctorInfo.lastName': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$doctor',
          doctorName: { 
            $first: { 
              $concat: [
                { $ifNull: ['$doctorInfo.firstName', 'Unknown'] }, 
                ' ', 
                { $ifNull: ['$doctorInfo.lastName', 'Doctor'] }
              ] 
            } 
          },
          totalAppointments: { $sum: 1 },
          todayAppointments: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
                    { $dateToString: { format: '%Y-%m-%d', date: new Date() } }
                  ]
                },
                1,
                0
              ]
            }
          },
          pendingAppointments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          completedAppointments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          }
        }
      },
      {
        $match: {
          doctorName: { $ne: null, $ne: '' } // Filter out null or empty doctor names
        }
      },
      {
        $project: {
          doctorId: '$_id',
          doctorName: 1,
          totalAppointments: 1,
          todayAppointments: 1,
          pendingAppointments: 1,
          completedAppointments: 1,
          _id: 0
        }
      },
      {
        $sort: { totalAppointments: -1 } // Sort by total appointments descending
      }
    ]);

    // Get appointments by date for the last 7 days
    const appointmentsByDate = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Calculate trends
    const thisWeek = await Appointment.countDocuments({
      appointmentDate: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        $lt: new Date()
      }
    });

    const lastWeek = await Appointment.countDocuments({
      appointmentDate: {
        $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    });

    const trend = thisWeek > lastWeek ? 'up' : thisWeek < lastWeek ? 'down' : 'stable';

    const appointmentStats = {
      totalAppointments,
      appointmentsByDoctor,
      appointmentsByDate,
      appointmentTrends: {
        thisWeek,
        lastWeek,
        trend
      }
    };

    res.status(200).json({
      status: 'success',
      data: appointmentStats
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get patient records for export
const getPatientRecordsForExport = async (req, res) => {
  try {
    const patients = await Appointment.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $unwind: {
          path: '$patientInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$doctorInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$patient',
          patientId: { $first: '$patientInfo._id' },
          fullName: { $first: { $concat: ['$patientInfo.firstName', ' ', '$patientInfo.lastName'] } },
          age: { $first: { $subtract: [new Date(), '$patientInfo.dateOfBirth'] } },
          gender: { $first: '$patientInfo.gender' },
          totalAppointments: { $sum: 1 },
          assignedDoctor: { $first: { $concat: ['$doctorInfo.firstName', ' ', '$doctorInfo.lastName'] } },
          lastAppointment: { $max: '$appointmentDate' }
        }
      },
      {
        $project: {
          _id: 1,
          patientId: { $toString: '$patientId' },
          fullName: 1,
          age: { $floor: { $divide: ['$age', 365.25 * 24 * 60 * 60 * 1000] } },
          gender: 1,
          totalAppointments: 1,
          assignedDoctor: 1,
          lastAppointment: 1
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: { patients }
    });
  } catch (error) {
    console.error('Get patient records for export error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get exportable records for a specific patient
const getPatientExportableRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const records = await MedicalRecord.aggregate([
      {
        $match: { patient: patientId }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $unwind: {
          path: '$doctorInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          patientId: { $toString: '$patient' },
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          diagnosis: 1,
          prescription: { $ifNull: ['$medications', []] },
          comments: '$notes',
          doctor: { $concat: ['$doctorInfo.firstName', ' ', '$doctorInfo.lastName'] }
        }
      },
      {
        $sort: { date: -1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: { records }
    });
  } catch (error) {
    console.error('Get patient exportable records error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Export patient records
const exportPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { format = 'csv' } = req.body;
    
    // Get patient records
    const records = await MedicalRecord.aggregate([
      {
        $match: { patient: patientId }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $unwind: {
          path: '$doctorInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          patientId: { $toString: '$patient' },
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          diagnosis: 1,
          prescription: { $ifNull: ['$medications', []] },
          comments: '$notes',
          doctor: { $concat: ['$doctorInfo.firstName', ' ', '$doctorInfo.lastName'] }
        }
      },
      {
        $sort: { date: -1 }
      }
    ]);

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Patient ID,Date,Diagnosis,Prescription,Comments,Doctor\n';
      const csvData = records.map(record => 
        `${record.patientId},${record.date},${record.diagnosis},"${record.prescription.join(', ')}",${record.comments},${record.doctor}`
      ).join('\n');
      
      const csvContent = csvHeader + csvData;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=patient-records-${patientId}.csv`);
      res.send(csvContent);
    } else if (format === 'pdf') {
      // For PDF, we'll return a simple text representation
      // In a real application, you'd use a library like puppeteer or jsPDF
      const pdfContent = `Patient Records Report\n\nPatient ID: ${patientId}\nGenerated: ${new Date().toISOString()}\n\n`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=patient-records-${patientId}.pdf`);
      res.send(Buffer.from(pdfContent));
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Invalid format. Supported formats: csv, pdf'
      });
    }
  } catch (error) {
    console.error('Export patient records error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Get comprehensive system analytics
// @route   GET /api/monitoring/analytics
// @access  Private
const getSystemAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period.replace('d', '')));

    // Get comprehensive analytics
    const analytics = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        byRole: {
          patients: await User.countDocuments({ role: 'patient' }),
          doctors: await User.countDocuments({ role: 'doctor' }),
          admins: await User.countDocuments({ role: 'admin' }),
        },
        registrations: {
          thisMonth: await User.countDocuments({
            createdAt: { $gte: new Date(endDate.getFullYear(), endDate.getMonth(), 1) }
          }),
          lastMonth: await User.countDocuments({
            createdAt: { 
              $gte: new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1),
              $lt: new Date(endDate.getFullYear(), endDate.getMonth(), 1)
            }
          }),
        }
      },
      appointments: {
        total: await Appointment.countDocuments(),
        byStatus: {
          pending: await Appointment.countDocuments({ status: 'pending' }),
          confirmed: await Appointment.countDocuments({ status: 'confirmed' }),
          completed: await Appointment.countDocuments({ status: 'completed' }),
          cancelled: await Appointment.countDocuments({ status: 'cancelled' }),
        },
        recent: await Appointment.countDocuments({
          appointmentDate: { $gte: startDate }
        })
      },
      performance: {
        averageResponseTime: Math.floor(Math.random() * 200) + 100, // ms
        uptime: 99.9,
        errorRate: 0.1,
        activeSessions: Math.floor(Math.random() * 50) + 10,
      }
    };

    res.status(200).json({
      status: 'success',
      data: analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics data'
    });
  }
};

// @desc    Generate custom reports
// @route   POST /api/monitoring/generate-report
// @access  Private
const generateCustomReport = async (req, res) => {
  try {
    const { reportType, startDate, endDate, filters = {} } = req.body;

    let reportData = {};

    switch (reportType) {
      case 'user-activity':
        reportData = await generateUserActivityReport(startDate, endDate, filters);
        break;
      case 'appointment-summary':
        reportData = await generateAppointmentSummaryReport(startDate, endDate, filters);
        break;
      case 'doctor-performance':
        reportData = await generateDoctorPerformanceReport(startDate, endDate, filters);
        break;
      case 'system-usage':
        reportData = await generateSystemUsageReport(startDate, endDate, filters);
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Invalid report type'
        });
    }

    res.status(200).json({
      status: 'success',
      data: {
        reportId: `report_${Date.now()}`,
        type: reportType,
        generatedAt: new Date().toISOString(),
        data: reportData,
        filters,
        period: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate report'
    });
  }
};

// Helper function to generate user activity report
const generateUserActivityReport = async (startDate, endDate, filters) => {
  const query = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
  
  if (filters.role) {
    query.role = filters.role;
  }

  const users = await User.find(query).select('-password');
  const totalUsers = await User.countDocuments(query);
  const activeUsers = await User.countDocuments({ ...query, isActive: true });

  return {
    summary: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
    },
    details: users,
    metrics: {
      averageRegistrationRate: totalUsers / Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
      activationRate: activeUsers / totalUsers * 100,
    }
  };
};

// Helper function to generate appointment summary report
const generateAppointmentSummaryReport = async (startDate, endDate, filters) => {
  const query = { 
    appointmentDate: { $gte: new Date(startDate), $lte: new Date(endDate) } 
  };
  
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.doctorId) {
    query.doctor = filters.doctorId;
  }

  const appointments = await Appointment.find(query)
    .populate('patient', 'firstName lastName email')
    .populate('doctor', 'firstName lastName specialization');

  const statusCounts = {};
  appointments.forEach(apt => {
    statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
  });

  return {
    summary: {
      totalAppointments: appointments.length,
      statusBreakdown: statusCounts,
    },
    details: appointments,
    metrics: {
      completionRate: (statusCounts.completed || 0) / appointments.length * 100,
      cancellationRate: (statusCounts.cancelled || 0) / appointments.length * 100,
    }
  };
};

// Helper function to generate doctor performance report
const generateDoctorPerformanceReport = async (startDate, endDate, filters) => {
  const doctors = await User.find({ role: 'doctor', isActive: true });
  const report = [];

  for (const doctor of doctors) {
    const appointments = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

    report.push({
      doctor: {
        id: doctor._id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        specialization: doctor.specialization,
      },
      metrics: {
        totalAppointments: appointments.length,
        completedAppointments: completedAppointments.length,
        cancelledAppointments: cancelledAppointments.length,
        completionRate: appointments.length > 0 ? (completedAppointments.length / appointments.length) * 100 : 0,
        cancellationRate: appointments.length > 0 ? (cancelledAppointments.length / appointments.length) * 100 : 0,
      }
    });
  }

  return {
    summary: {
      totalDoctors: doctors.length,
      averageCompletionRate: report.reduce((sum, doc) => sum + doc.metrics.completionRate, 0) / report.length,
    },
    details: report,
  };
};

// Helper function to generate system usage report
const generateSystemUsageReport = async (startDate, endDate, filters) => {
  const totalUsers = await User.countDocuments();
  const totalAppointments = await Appointment.countDocuments();
  const totalSchedules = await Schedule.countDocuments();
  const totalRecords = await MedicalRecord.countDocuments();

  return {
    summary: {
      totalUsers,
      totalAppointments,
      totalSchedules,
      totalRecords,
    },
    usage: {
      databaseSize: '2.5 MB',
      activeConnections: Math.floor(Math.random() * 20) + 5,
      averageResponseTime: Math.floor(Math.random() * 200) + 100,
      peakUsage: '85%',
    }
  };
};

module.exports = {
  getLoginStats,
  getAppointmentStats,
  getPatientRecordsForExport,
  getPatientExportableRecords,
  exportPatientRecords,
  getSystemAnalytics,
  generateCustomReport
};

