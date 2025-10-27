import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

interface MedicalRecord {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  diagnosis: string;
  notes: string;
  symptoms: string[];
  prescription: string;
  followUpDate?: string;
  followUpNotes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
}

const MedicalRecordsManagement: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    patient: '',
    diagnosis: '',
    notes: '',
    symptoms: '',
    prescription: '',
    followUpDate: '',
    followUpNotes: '',
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadMedicalRecords(),
        loadPatients()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMedicalRecords = async () => {
    try {
      const response = await apiService.getDoctorMedicalRecords();
      setRecords(response.data.records || []);
    } catch (error) {
      console.error('Error loading medical records:', error);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await apiService.getPatients();
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const recordData = {
        ...formData,
        symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s),
        followUpDate: formData.followUpDate || undefined
      };

      if (selectedRecord) {
        await apiService.updateMedicalRecord(selectedRecord._id, recordData);
      } else {
        await apiService.createMedicalRecord(recordData);
      }

      await loadMedicalRecords();
      resetForm();
    } catch (error) {
      console.error('Error saving medical record:', error);
    }
  };

  const handleEdit = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setFormData({
      patient: record.patient._id,
      diagnosis: record.diagnosis,
      notes: record.notes,
      symptoms: record.symptoms.join(', '),
      prescription: record.prescription || '',
      followUpDate: record.followUpDate || '',
      followUpNotes: record.followUpNotes || '',
      status: record.status
    });
    setShowEditForm(true);
  };

  const handleDelete = async (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this medical record?')) {
      try {
        await apiService.deleteMedicalRecord(recordId);
        await loadMedicalRecords();
      } catch (error) {
        console.error('Error deleting medical record:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      patient: '',
      diagnosis: '',
      notes: '',
      symptoms: '',
      prescription: '',
      followUpDate: '',
      followUpNotes: '',
      status: 'active'
    });
    setSelectedRecord(null);
    setShowAddForm(false);
    setShowEditForm(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      archived: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchQuery === '' || 
      record.patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medical Records Management</h1>
            <p className="text-gray-600 mt-1">View, create, edit, and manage medical records for your patients</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Record
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search records by patient name or diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medical Records List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Medical Records ({filteredRecords.length})
          </h3>

          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div key={record._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {record.patient.firstName} {record.patient.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{record.patient.email}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(record.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(record.status)}
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(record._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Diagnosis</h5>
                    <p className="text-sm text-gray-600">{record.diagnosis}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Symptoms</h5>
                    <p className="text-sm text-gray-600">
                      {record.symptoms.length > 0 ? record.symptoms.join(', ') : 'No symptoms recorded'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                    <p className="text-sm text-gray-600">{record.notes}</p>
                  </div>
                  {record.prescription && (
                    <div className="md:col-span-2">
                      <h5 className="font-medium text-gray-900 mb-2">Prescription</h5>
                      <p className="text-sm text-gray-600">{record.prescription}</p>
                    </div>
                  )}
                  {record.followUpDate && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Follow-up Date</h5>
                      <p className="text-sm text-gray-600">
                        {new Date(record.followUpDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records found</h3>
              <p className="text-gray-600">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by adding medical records for your patients.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || showEditForm) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedRecord ? 'Edit Medical Record' : 'Add New Medical Record'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Patient *</label>
                  <select
                    value={formData.patient}
                    onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select a patient...</option>
                    {patients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.firstName} {patient.lastName} - {patient.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Diagnosis *</label>
                  <input
                    type="text"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    className="input"
                    required
                    placeholder="Enter diagnosis..."
                  />
                </div>

                <div>
                  <label className="label">Symptoms</label>
                  <input
                    type="text"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    className="input"
                    placeholder="Enter symptoms separated by commas..."
                  />
                </div>

                <div>
                  <label className="label">Notes *</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows={4}
                    required
                    placeholder="Enter detailed notes..."
                  />
                </div>

                <div>
                  <label className="label">Prescription</label>
                  <textarea
                    value={formData.prescription}
                    onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Enter prescription details..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Follow-up Date</label>
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Follow-up Notes</label>
                  <textarea
                    value={formData.followUpNotes}
                    onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Enter follow-up instructions..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {selectedRecord ? 'Update Record' : 'Create Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsManagement;
