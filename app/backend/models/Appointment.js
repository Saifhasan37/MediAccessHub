const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  duration: {
    type: Number,
    default: 30, // in minutes
    min: [15, 'Appointment duration must be at least 15 minutes'],
    max: [120, 'Appointment duration cannot exceed 120 minutes']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup', 'specialist'],
    default: 'consultation'
  },
  reason: {
    type: String,
    required: [true, 'Appointment reason is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  symptoms: [String],
  diagnosis: String,
  prescription: String,
  followUpDate: Date,
  followUpNotes: String,
  // Payment information
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'insurance', 'online'],
    default: 'online'
  },
  // Reminder settings
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderDate: Date,
  // Cancellation information
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  cancelledAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ status: 1 });

// Virtual for appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function() {
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Check if appointment is in the past
appointmentSchema.virtual('isPast').get(function() {
  return this.appointmentDateTime < new Date();
});

// Check if appointment is today
appointmentSchema.virtual('isToday').get(function() {
  const today = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  return appointmentDate.toDateString() === today.toDateString();
});

// Ensure virtual fields are serialized
appointmentSchema.set('toJSON', {
  virtuals: true
});

// Pre-save middleware to validate appointment time
appointmentSchema.pre('save', function(next) {
  // Check if appointment is not in the past (except for completed appointments)
  if (this.isNew && this.appointmentDateTime < new Date() && this.status !== 'completed') {
    return next(new Error('Cannot schedule appointments in the past'));
  }
  
  // Check if appointment date is not more than 6 months in the future
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  if (this.appointmentDateTime > sixMonthsFromNow) {
    return next(new Error('Cannot schedule appointments more than 6 months in advance'));
  }
  
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);

