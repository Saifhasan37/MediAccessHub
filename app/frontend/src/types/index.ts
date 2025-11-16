export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  role: 'patient' | 'doctor' | 'admin' | 'monitor';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  profilePicture?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  // Doctor-specific fields
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  bio?: string;
  consultationFee?: number;
  // Patient-specific fields
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  insuranceProvider?: string;
  insuranceNumber?: string;
  allergies?: string[];
  currentMedications?: string[];
  medicalHistory?: string[];
}

export interface Appointment {
  _id: string;
  patient: User | string;
  doctor: User | string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  type: 'consultation' | 'follow-up' | 'emergency' | 'routine-checkup' | 'specialist';
  reason: string;
  notes?: string;
  symptoms?: string[];
  diagnosis?: string;
  prescription?: string;
  followUpDate?: string;
  followUpNotes?: string;
  consultationFee: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'insurance' | 'online';
  reminderSent: boolean;
  reminderDate?: string;
  cancelledBy?: User | string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  _id: string;
  patient: User | string;
  doctor: User | string;
  appointment?: Appointment | string;
  recordType: 'consultation' | 'diagnosis' | 'prescription' | 'lab-result' | 'imaging' | 'vaccination' | 'surgery' | 'emergency';
  title: string;
  description: string;
  vitalSigns?: {
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
  };
  symptoms?: string[];
  diagnosis?: string[];
  treatment?: string;
  medications?: {
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    prescribedDate: string;
  }[];
  labResults?: {
    testName: string;
    result: string;
    normalRange?: string;
    date: string;
    labName?: string;
  }[];
  followUpRequired: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  attachments?: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: string;
  }[];
  isConfidential: boolean;
  accessLevel: 'public' | 'restricted' | 'confidential';
  status: 'draft' | 'finalized' | 'archived';
  reviewedBy?: User | string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  _id: string;
  doctor: User | string;
  date: string;
  timeSlots: {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    appointmentType: 'consultation' | 'follow-up' | 'emergency' | 'routine-checkup' | 'specialist';
    maxPatients: number;
    currentPatients: number;
  }[];
  breakTime?: {
    startTime: string;
    endTime: string;
    reason?: string;
  }[];
  isWorkingDay: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  appointmentDuration: number;
  consultationFee: number;
  notes?: string;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  recurringEndDate?: string;
  status: 'active' | 'inactive' | 'cancelled';
  createdBy: User | string;
  lastModifiedBy?: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  results?: number;
  total?: number;
  page?: number;
  pages?: number;
  errors?: any[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  role?: 'patient' | 'doctor' | 'admin' | 'monitor';
  // Doctor-specific fields
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  bio?: string;
  // Patient-specific fields
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  insuranceProvider?: string;
  insuranceNumber?: string;
  allergies?: string[];
  currentMedications?: string[];
  medicalHistory?: string[];
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  updateProfile: (data: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalPatients?: number;
  totalDoctors?: number;
  totalRevenue?: number;
  monthlyRevenue?: number;
}
