import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, Eye, Filter, Plus } from 'lucide-react';

const MedicalRecordsPage: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  // Mock data - in a real app, this would come from API
  const records = [
    {
      id: '1',
      title: 'Annual Physical Examination',
      type: 'consultation',
      date: '2024-01-10',
      doctor: { name: 'Dr. Smith', specialization: 'General Medicine' },
      patient: { name: 'John Doe' },
      status: 'finalized',
      description: 'Annual health checkup with routine blood work and vital signs monitoring.'
    },
    {
      id: '2',
      title: 'Blood Test Results',
      type: 'lab-result',
      date: '2024-01-08',
      doctor: { name: 'Dr. Smith', specialization: 'General Medicine' },
      patient: { name: 'John Doe' },
      status: 'finalized',
      description: 'Complete blood count and metabolic panel results.'
    },
  ];

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

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.map((record) => (
          <div key={record.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{record.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {user?.role === 'patient' ? record.doctor.name : record.patient.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTypeBadge(record.type)}
                  {getStatusBadge(record.status)}
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">{record.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Type: {record.type}</span>
                  <span>Status: {record.status}</span>
                </div>
                <div className="flex space-x-2">
                  <button className="btn-outline text-sm px-3 py-1 flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </button>
                  {record.status === 'finalized' && (
                    <button className="btn-outline text-sm px-3 py-1 flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
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

