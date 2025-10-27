import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, Calendar, Edit, Save, X } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || '',
    },
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || '',
      },
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your profile information</p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="btn-success flex items-center"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="btn-outline flex items-center"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary flex items-center"
            >
              <Edit className="h-5 w-5 mr-2" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-body text-center">
              <div className="h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-gray-500 mb-4 capitalize">
                {user?.role}
              </p>
              {user?.role === 'doctor' && user?.specialization && (
                <p className="text-sm text-gray-600 mb-2">
                  {user.specialization}
                </p>
              )}
              {user?.role === 'doctor' && user?.yearsOfExperience && (
                <p className="text-sm text-gray-600 mb-2">
                  {user.yearsOfExperience} years of experience
                </p>
              )}
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
            </div>
            <div className="card-body space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.lastName}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <div className="flex items-center text-gray-900">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="input"
                      />
                    ) : (
                      <div className="flex items-center text-gray-900">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {user?.phone}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label">Date of Birth</label>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {user?.dateOfBirth && new Date(user.dateOfBirth).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <label className="label">Gender</label>
                    <p className="text-gray-900 capitalize">{user?.gender}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Street Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address.street}
                        onChange={(e) => handleInputChange('address.street', e.target.value)}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.address?.street || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">City</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.address?.city || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">State</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.address?.state || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">ZIP Code</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address.zipCode}
                        onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.address?.zipCode || 'Not provided'}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Country</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.address?.country || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {user?.role === 'doctor' && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Bio</h4>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="input"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-900">{user?.bio || 'No bio provided'}</p>
                  )}
                </div>
              )}

              {/* Doctor-specific information */}
              {user?.role === 'doctor' && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Professional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Specialization</label>
                      <p className="text-gray-900">{user?.specialization}</p>
                    </div>
                    <div>
                      <label className="label">License Number</label>
                      <p className="text-gray-900">{user?.licenseNumber}</p>
                    </div>
                    <div>
                      <label className="label">Years of Experience</label>
                      <p className="text-gray-900">{user?.yearsOfExperience}</p>
                    </div>
                    <div>
                      <label className="label">Consultation Fee</label>
                      <p className="text-gray-900">${user?.consultationFee}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient-specific information */}
              {user?.role === 'patient' && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Medical Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Insurance Provider</label>
                      <p className="text-gray-900">{user?.insuranceProvider || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="label">Insurance Number</label>
                      <p className="text-gray-900">{user?.insuranceNumber || 'Not provided'}</p>
                    </div>
                    {user?.allergies && user.allergies.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="label">Allergies</label>
                        <div className="flex flex-wrap gap-2">
                          {user.allergies.map((allergy, index) => (
                            <span key={index} className="badge-warning">{allergy}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {user?.currentMedications && user.currentMedications.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="label">Current Medications</label>
                        <div className="flex flex-wrap gap-2">
                          {user.currentMedications.map((medication, index) => (
                            <span key={index} className="badge-info">{medication}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
