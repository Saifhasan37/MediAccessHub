const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  date: {
    type: Date,
    required: [true, 'Schedule date is required']
  },
  timeSlots: [{
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    appointmentType: {
      type: String,
      enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup', 'specialist'],
      default: 'consultation'
    },
    maxPatients: {
      type: Number,
      default: 1,
      min: [1, 'Maximum patients must be at least 1']
    },
    currentPatients: {
      type: Number,
      default: 0
    }
  }],
  breakTime: [{
    startTime: String,
    endTime: String,
    reason: String
  }],
  isWorkingDay: {
    type: Boolean,
    default: true
  },
  workingHours: {
    start: {
      type: String,
      default: '09:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    },
    end: {
      type: String,
      default: '17:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    }
  },
  appointmentDuration: {
    type: Number,
    default: 30, // in minutes
    min: [15, 'Appointment duration must be at least 15 minutes'],
    max: [120, 'Appointment duration cannot exceed 120 minutes']
  },
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  // Recurring schedule settings
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: function() { return this.isRecurring; }
  },
  recurringDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  recurringEndDate: Date,
  // Schedule status
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
scheduleSchema.index({ doctor: 1, date: 1 });
scheduleSchema.index({ date: 1 });
scheduleSchema.index({ status: 1 });

// Virtual to check if schedule is in the past
scheduleSchema.virtual('isPast').get(function() {
  const today = new Date();
  const scheduleDate = new Date(this.date);
  scheduleDate.setHours(23, 59, 59, 999); // End of day
  return scheduleDate < today;
});

// Virtual to get available time slots
scheduleSchema.virtual('availableSlots').get(function() {
  return this.timeSlots.filter(slot => slot.isAvailable && slot.currentPatients < slot.maxPatients);
});

// Virtual to get total available appointments for the day
scheduleSchema.virtual('totalAvailableAppointments').get(function() {
  return this.timeSlots.reduce((total, slot) => {
    if (slot.isAvailable) {
      return total + (slot.maxPatients - slot.currentPatients);
    }
    return total;
  }, 0);
});

// Ensure virtual fields are serialized
scheduleSchema.set('toJSON', {
  virtuals: true
});

// Pre-save middleware to validate schedule data
scheduleSchema.pre('save', function(next) {
  // Validate time slots
  for (const slot of this.timeSlots) {
    const startTime = new Date(`2000-01-01T${slot.startTime}:00`);
    const endTime = new Date(`2000-01-01T${slot.endTime}:00`);
    
    if (endTime <= startTime) {
      return next(new Error('End time must be after start time for each time slot'));
    }
  }
  
  // Validate working hours
  if (this.workingHours.start && this.workingHours.end) {
    const startTime = new Date(`2000-01-01T${this.workingHours.start}:00`);
    const endTime = new Date(`2000-01-01T${this.workingHours.end}:00`);
    
    if (endTime <= startTime) {
      return next(new Error('Working hours end time must be after start time'));
    }
  }
  
  // Validate break times
  for (const breakTime of this.breakTime) {
    const startTime = new Date(`2000-01-01T${breakTime.startTime}:00`);
    const endTime = new Date(`2000-01-01T${breakTime.endTime}:00`);
    
    if (endTime <= startTime) {
      return next(new Error('Break end time must be after start time'));
    }
  }
  
  next();
});

// Static method to find available schedules for a doctor
scheduleSchema.statics.findAvailableSchedules = function(doctorId, startDate, endDate) {
  return this.find({
    doctor: doctorId,
    date: {
      $gte: startDate,
      $lte: endDate
    },
    status: 'active',
    isWorkingDay: true
  }).populate('doctor', 'firstName lastName specialization');
};

// Instance method to check if a time slot is available
scheduleSchema.methods.isTimeSlotAvailable = function(timeSlotId) {
  const slot = this.timeSlots.id(timeSlotId);
  return slot && slot.isAvailable && slot.currentPatients < slot.maxPatients;
};

// Instance method to book a time slot
scheduleSchema.methods.bookTimeSlot = function(timeSlotId) {
  const slot = this.timeSlots.id(timeSlotId);
  if (slot && slot.isAvailable && slot.currentPatients < slot.maxPatients) {
    slot.currentPatients += 1;
    if (slot.currentPatients >= slot.maxPatients) {
      slot.isAvailable = false;
    }
    return true;
  }
  return false;
};

// Instance method to release a time slot
scheduleSchema.methods.releaseTimeSlot = function(timeSlotId) {
  const slot = this.timeSlots.id(timeSlotId);
  if (slot && slot.currentPatients > 0) {
    slot.currentPatients -= 1;
    slot.isAvailable = true;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Schedule', scheduleSchema);

