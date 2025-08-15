import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Heart, 
  Activity, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  FileText,
  Plus,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPredictions: 0,
    lastPrediction: null,
    riskLevel: 'Low',
    nextCheckup: null
  });

  useEffect(() => {
    // Fetch user stats and recent predictions
    // This would typically call an API endpoint
  }, []);

  const quickActions = [
    {
      title: 'New Prediction',
      description: 'Make a new heart disease prediction',
      icon: <Plus className="w-8 h-8" />,
      action: () => navigate('/prediction'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'View History',
      description: 'Check your prediction history',
      icon: <FileText className="w-8 h-8" />,
      action: () => navigate('/history'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Find Doctors',
      description: 'Locate nearby cardiologists',
      icon: <MapPin className="w-8 h-8" />,
      action: () => navigate('/nearby-doctors'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Health Profile',
      description: 'Update your health information',
      icon: <Activity className="w-8 h-8" />,
      action: () => navigate('/profile'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor your heart health and get personalized recommendations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPredictions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Risk Level</p>
                <p className="text-2xl font-semibold text-green-600">{stats.riskLevel}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Prediction</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.lastPrediction ? '2 days ago' : 'Never'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Checkup</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.nextCheckup ? 'In 3 months' : 'Not scheduled'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`${action.color} text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-left`}
              >
                <div className="mb-3">{action.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent predictions found</p>
              <p className="text-sm">Start by making your first heart disease prediction</p>
              <button
                onClick={() => navigate('/prediction')}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Make Prediction
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
