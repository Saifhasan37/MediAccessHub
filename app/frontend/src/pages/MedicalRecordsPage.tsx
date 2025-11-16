import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Eye, Filter, Plus, Loader } from 'lucide-react';
import apiService from '../services/api';
import { toast } from 'react-toastify';

const MedicalRecordsPage: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const userIdRef = useRef<string | null>(null);

  const fetchMedicalRecords = useCallback(async () => {
    if (!user || isFetchingRef.current) return; // Prevent duplicate calls
    
    const userId = user._id;
    const currentUserId = userIdRef.current;
    
    // If we've already fetched for this user and have data, don't re-fetch
    if (hasFetchedRef.current && currentUserId === userId) {
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      userIdRef.current = userId; // Update ref with current user ID
      
      let response;
      if (user.role === 'patient') {
        response = await apiService.getPatientMedicalRecords(userId);
      } else if (user.role === 'doctor') {
        response = await apiService.getDoctorMedicalRecords();
      } else if (user.role === 'admin') {
        response = await apiService.getAllMedicalRecords();
      }
      
      console.log('API Response:', response);
      
      // Handle backend response structure: { status: 'success', data: { records: [...] } }
      let recordsData = [];
      
      // Check if response has error status
      if (response?.status === 'error') {
        const errorMessage = response?.message || 'Failed to fetch medical records';
        // Don't throw error for "not found" messages - just return empty array
        if (errorMessage.toLowerCase().includes('medical record not found')) {
          console.log('No records found (this is normal):', errorMessage);
          recordsData = [];
        } else {
          throw new Error(errorMessage);
        }
      } else if (response?.data?.records && Array.isArray(response.data.records)) {
        // Standard backend structure: { status: 'success', data: { records: [...] } }
        recordsData = response.data.records;
      } else if (response?.data?.data?.records && Array.isArray(response.data.data.records)) {
        // Double nested structure
        recordsData = response.data.data.records;
      } else if (Array.isArray(response?.data)) {
        // Direct array response
        recordsData = response.data;
      } else if (Array.isArray(response)) {
        // Direct array response (fallback)
        recordsData = response;
      } else if (response?.data && typeof response.data === 'object') {
        // Try to extract records from response data
        console.warn('Unexpected response structure:', response);
        recordsData = [];
      } else {
        // Empty response is okay - means no records
        console.log('Empty or unexpected response, treating as no records');
        recordsData = [];
      }

      // Transform the data to match the expected format
      const transformedRecords = recordsData
        .filter((record: any) => record && record._id) // Filter out invalid records
        .map((record: any) => {
          // Handle diagnosis - can be string or array
          const diagnosis = Array.isArray(record.diagnosis) 
            ? record.diagnosis.join(', ') 
            : (record.diagnosis || '');
          
          // Handle symptoms - can be string or array
          const symptoms = Array.isArray(record.symptoms) 
            ? record.symptoms.join(', ') 
            : (record.symptoms || '');
          
          return {
            id: record._id,
            title: record.title || diagnosis || 'Untitled Record',
            type: record.recordType || 'consultation',
            date: record.createdAt || record.date || new Date().toISOString(),
            doctor: {
              name: `${record.doctor?.firstName || ''} ${record.doctor?.lastName || ''}`.trim() || 'Unknown Doctor',
              specialization: record.doctor?.specialization || 'N/A'
            },
            patient: {
              name: `${record.patient?.firstName || ''} ${record.patient?.lastName || ''}`.trim() || 'Unknown Patient',
              email: record.patient?.email || ''
            },
            status: record.status || 'draft',
            description: record.description || 'No description available',
            notes: record.notes || record.reviewNotes || '',
            diagnosis: diagnosis,
            symptoms: symptoms,
            treatment: record.treatment || record.prescription || '',
            followUpDate: record.followUpDate || '',
            followUpNotes: record.followUpNotes || '',
            medications: record.medications || []
          };
        });
      
      setRecords(transformedRecords);
      hasFetchedRef.current = true;
    } catch (error: any) {
      console.error('Error fetching medical records:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || '';
      
      // Handle different error cases
      if (error.response?.status === 404) {
        // 404 means no records found, which is okay - just show empty state
        setRecords([]);
        hasFetchedRef.current = true; // Mark as fetched even if empty
        // Don't show error toast for 404 - it's not necessarily an error
      } else if (error.response?.status === 403) {
        // Only show 403 error if it's not about "no records"
        if (!errorMessage.toLowerCase().includes('medical record not found')) {
          toast.error('You do not have permission to view medical records');
        }
        setRecords([]);
        hasFetchedRef.current = true;
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        setRecords([]);
        hasFetchedRef.current = true;
      } else {
        // Don't show error if message is "Medical record not found" - this is normal when there are no records
        if (errorMessage && errorMessage.toLowerCase().includes('medical record not found')) {
          // This is okay - just means no records exist
          setRecords([]);
          hasFetchedRef.current = true;
        } else if (errorMessage) {
          // Only show error for actual server errors
          toast.error(errorMessage, { autoClose: 3000 });
          setRecords([]);
          hasFetchedRef.current = true;
        } else {
          // Generic error fallback
          console.error('Unexpected error fetching medical records:', error);
          setRecords([]);
          hasFetchedRef.current = true;
        }
      }
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user]); // Only depend on user object

  useEffect(() => {
    // Only fetch when user exists and hasn't been fetched yet
    if (user && user._id) {
      const userId = user._id;
      
      // Reset fetch flag if user changed
      if (userIdRef.current !== userId) {
        hasFetchedRef.current = false;
        userIdRef.current = userId;
      }
      
      // Only fetch if we haven't fetched for this user yet
      if (!hasFetchedRef.current && !isFetchingRef.current) {
        fetchMedicalRecords();
      }
    }
  }, [user?._id, fetchMedicalRecords]); // Depend on user ID and fetchMedicalRecords

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'consultation':
        return <span className="badge-info">Consultation</span>;
      case 'lab-result':
        return <span className="badge-success">Lab Result</span>;
      case 'prescription':
        return <span className="badge-warning">Prescription</span>;
      case 'diagnosis':
        return <span className="badge-error">Diagnosis</span>;
      default:
        return <span className="badge-gray">{type}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finalized':
        return <span className="badge-success">Finalized</span>;
      case 'draft':
        return <span className="badge-warning">Draft</span>;
      case 'archived':
        return <span className="badge-gray">Archived</span>;
      default:
        return <span className="badge-gray">{status}</span>;
    }
  };

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true;
    return record.type === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600">View and manage medical records</p>
        </div>
        {user?.role === 'doctor' && (
          <button className="btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Record
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-2">
              {['all', 'consultation', 'lab-result', 'prescription', 'diagnosis'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    filter === type
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card">
          <div className="card-body text-center py-12">
            <Loader className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading medical records...</p>
          </div>
        </div>
      )}

      {/* Records List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
          <div key={record.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{record.title}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {user?.role === 'patient' ? (
                        <>
                          <span className="font-medium">Doctor:</span> {record.doctor.name}
                          {record.doctor.specialization && record.doctor.specialization !== 'N/A' && (
                            <span className="text-gray-500"> • {record.doctor.specialization}</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="font-medium">Patient:</span> {record.patient.name}
                          {record.patient.email && (
                            <span className="text-gray-500"> • {record.patient.email}</span>
                          )}
                        </>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTypeBadge(record.type)}
                  {getStatusBadge(record.status)}
                </div>
              </div>

              {/* Description */}
              {record.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700">{record.description}</p>
                </div>
              )}

              {/* Medical Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Diagnosis */}
                {record.diagnosis && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1 text-sm">Diagnosis</h5>
                    <p className="text-sm text-gray-600">{record.diagnosis}</p>
                  </div>
                )}

                {/* Symptoms */}
                {record.symptoms && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1 text-sm">Symptoms</h5>
                    <p className="text-sm text-gray-600">{record.symptoms}</p>
                  </div>
                )}

                {/* Treatment/Prescription */}
                {record.treatment && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1 text-sm">Treatment/Prescription</h5>
                    <p className="text-sm text-gray-600">{record.treatment}</p>
                  </div>
                )}

                {/* Follow-up Date */}
                {record.followUpDate && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1 text-sm">Follow-up Date</h5>
                    <p className="text-sm text-gray-600">
                      {new Date(record.followUpDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {record.notes && (
                  <div className="md:col-span-2">
                    <h5 className="font-medium text-gray-900 mb-1 text-sm">Notes</h5>
                    <p className="text-sm text-gray-600">{record.notes}</p>
                  </div>
                )}

                {/* Follow-up Notes */}
                {record.followUpNotes && (
                  <div className="md:col-span-2">
                    <h5 className="font-medium text-gray-900 mb-1 text-sm">Follow-up Notes</h5>
                    <p className="text-sm text-gray-600">{record.followUpNotes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Type: {record.type}</span>
                  <span>Status: {record.status}</span>
                </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {!isLoading && filteredRecords.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You don't have any medical records yet." 
                : `No records of type "${filter}" found.`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsPage;

