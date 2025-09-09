import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  X,
  Shield,
  Heart,
  Activity,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword, updateLocation } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      gender: user?.gender || '',
      address: (user?.address && (user.address.street || user.address.city || user.address.state || user.address.zipCode || user.address.country))
        ? [user.address.street, user.address.city, user.address.state, user.address.zipCode, user.address.country].filter(Boolean).join(', ')
        : ''
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm();
  const { register: registerLocation, handleSubmit: handleLocationSubmit, formState: { errors: locationErrors }, reset: resetLocation } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || '',
        address: (user.address && (user.address.street || user.address.city || user.address.state || user.address.zipCode || user.address.country))
          ? [user.address.street, user.address.city, user.address.state, user.address.zipCode, user.address.country].filter(Boolean).join(', ')
          : ''
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await updateProfile(data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      setIsEditingPassword(false);
      resetPassword();
      toast.success('Password updated successfully!');
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const onLocationSubmit = async (data) => {
    setIsLoading(true);
    try {
      await updateLocation(parseFloat(data.latitude), parseFloat(data.longitude));
      setIsEditingLocation(false);
      resetLocation();
      toast.success('Location updated successfully!');
    } catch (error) {
      toast.error('Failed to update location');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resetLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          toast.error('Unable to get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAge = (dateString) => {
    if (!dateString) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn btn-outline btn-sm"
                >
                  {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Name is required' })}
                      className="input w-full"
                      disabled={!isEditing}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="input w-full opacity-80 cursor-not-allowed"
                      disabled
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="input w-full"
                      disabled={!isEditing}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="input w-full"
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      {...register('gender')}
                      className="input w-full"
                      disabled={!isEditing}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="form-group md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      {...register('address')}
                      rows={3}
                      className="input w-full"
                      disabled={!isEditing}
                      placeholder="Enter your full address"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Password Change */}
            <div className="bg-white rounded-lg shadow mt-8">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                <button
                  onClick={() => setIsEditingPassword(!isEditingPassword)}
                  className="btn btn-outline btn-sm"
                >
                  {isEditingPassword ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  {isEditingPassword ? 'Cancel' : 'Change'}
                </button>
              </div>

              {isEditingPassword && (
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        {...registerPassword('currentPassword', { required: 'Current password is required' })}
                        className="input w-full"
                      />
                      {passwordErrors.currentPassword && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        {...registerPassword('newPassword', { 
                          required: 'New password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters'
                          }
                        })}
                        className="input w-full"
                      />
                      {passwordErrors.newPassword && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        {...registerPassword('confirmPassword', { required: 'Please confirm your password' })}
                        className="input w-full"
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingPassword(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Location Settings */}
            <div className="bg-white rounded-lg shadow mt-8">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Location Settings</h2>
                <button
                  onClick={() => setIsEditingLocation(!isEditingLocation)}
                  className="btn btn-outline btn-sm"
                >
                  {isEditingLocation ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  {isEditingLocation ? 'Cancel' : 'Update'}
                </button>
              </div>

              {isEditingLocation && (
                <form onSubmit={handleLocationSubmit(onLocationSubmit)} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...registerLocation('latitude', { 
                          required: 'Latitude is required',
                          min: -90,
                          max: 90
                        })}
                        className="input w-full"
                        placeholder="e.g., 40.7128"
                      />
                      {locationErrors.latitude && (
                        <p className="text-red-500 text-sm mt-1">{locationErrors.latitude.message}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...registerLocation('longitude', { 
                          required: 'Longitude is required',
                          min: -180,
                          max: 180
                        })}
                        className="input w-full"
                        placeholder="e.g., -74.0060"
                      />
                      {locationErrors.longitude && (
                        <p className="text-red-500 text-sm mt-1">{locationErrors.longitude.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="btn btn-outline"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Use Current Location
                    </button>
                  </div>

                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingLocation(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? 'Updating...' : 'Update Location'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">Age:</span>
                  <span className="ml-auto font-medium">{getAge(user?.dateOfBirth)}</span>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">Gender:</span>
                  <span className="ml-auto font-medium">{user?.gender || 'Not specified'}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-auto font-medium">{user?.phone || 'Not specified'}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-auto font-medium">
                    {user?.location ? 'Set' : 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user?.role || 'User'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(user?.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(user?.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn btn-outline btn-sm justify-start">
                  <Heart className="w-4 h-4 mr-2" />
                  Make Prediction
                </button>
                <button className="w-full btn btn-outline btn-sm justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  View History
                </button>
                <button className="w-full btn btn-outline btn-sm justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
