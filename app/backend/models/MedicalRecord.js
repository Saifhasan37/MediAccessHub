const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
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
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  recordType: {
    type: String,
    enum: ['consultation', 'diagnosis', 'prescription', 'lab-result', 'imaging', 'vaccination', 'surgery', 'emergency'],
    required: [true, 'Record type is required']
  },
  title: {
    type: String,
    required: [true, 'Record title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  // Vital signs
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: {
      type: Number,
      min: [30, 'Heart rate must be at least 30'],
      max: [250, 'Heart rate cannot exceed 250']
    },
    temperature: {
      type: Number,
      min: [95, 'Temperature must be at least 95°F'],
      max: [110, 'Temperature cannot exceed 110°F']
    },
    weight: {
      type: Number,
      min: [1, 'Weight must be at least 1 kg'],
      max: [500, 'Weight cannot exceed 500 kg']
    },
    height: {
      type: Number,
      min: [30, 'Height must be at least 30 cm'],
      max: [250, 'Height cannot exceed 250 cm']
    },
    oxygenSaturation: {
      type: Number,
      min: [70, 'Oxygen saturation must be at least 70%'],
      max: [100, 'Oxygen saturation cannot exceed 100%']
    }
  },
  // Medical information
  symptoms: [String],
  diagnosis: [String],
  treatment: {
    type: String,
    maxlength: [1000, 'Treatment description cannot exceed 1000 characters']
  },
  medications: [{
    name: {
      type: String,
      required: true
    },
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    prescribedDate: {
      type: Date,
      default: Date.now
    }
  }],
  // Lab results and tests
  labResults: [{
    testName: String,
    result: String,
    normalRange: String,
    date: Date,
    labName: String
  }],
  // Follow-up information
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String,
  // File attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Privacy and access control
  isConfidential: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['public', 'restricted', 'confidential'],
    default: 'restricted'
  },
  // Record status
  status: {
    type: String,
    enum: ['draft', 'finalized', 'archived'],
    default: 'draft'
  },
  // Review information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String
}, {
  timestamps: true
});

// Indexes for better query performance
medicalRecordSchema.index({ patient: 1, createdAt: -1 });
medicalRecordSchema.index({ doctor: 1, createdAt: -1 });
medicalRecordSchema.index({ recordType: 1 });
medicalRecordSchema.index({ status: 1 });

// Virtual for BMI calculation
medicalRecordSchema.virtual('bmi').get(function() {
  if (this.vitalSigns.weight && this.vitalSigns.height) {
    const heightInMeters = this.vitalSigns.height / 100;
    return (this.vitalSigns.weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  return null;
});

// Virtual for blood pressure category
medicalRecordSchema.virtual('bloodPressureCategory').get(function() {
  if (!this.vitalSigns.bloodPressure.systolic || !this.vitalSigns.bloodPressure.diastolic) {
    return null;
  }
  
  const systolic = this.vitalSigns.bloodPressure.systolic;
  const diastolic = this.vitalSigns.bloodPressure.diastolic;
  
  if (systolic < 120 && diastolic < 80) return 'Normal';
  if (systolic < 130 && diastolic < 80) return 'Elevated';
  if (systolic < 140 || diastolic < 90) return 'High Blood Pressure Stage 1';
  if (systolic < 180 || diastolic < 120) return 'High Blood Pressure Stage 2';
  return 'Hypertensive Crisis';
});

// Ensure virtual fields are serialized
medicalRecordSchema.set('toJSON', {
  virtuals: true
});

// Pre-save middleware to validate record data
medicalRecordSchema.pre('save', function(next) {
  // Validate blood pressure values
  if (this.vitalSigns.bloodPressure) {
    const bp = this.vitalSigns.bloodPressure;
    if (bp.systolic && bp.diastolic && bp.systolic <= bp.diastolic) {
      return next(new Error('Systolic pressure must be higher than diastolic pressure'));
    }
  }
  
  // Set review information if status is finalized
  if (this.isModified('status') && this.status === 'finalized' && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);

