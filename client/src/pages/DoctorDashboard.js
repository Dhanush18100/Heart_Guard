import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Heart, 
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Search,
  Filter,
  Eye,
  Edit,
  Send,
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [recommendation, setRecommendation] = useState('');

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    try {
      // Fetch predictions assigned to this doctor
      const predictionsResponse = await fetch('/api/admin/predictions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (predictionsResponse.ok) {
        const predictionsData = await predictionsResponse.json();
        setPredictions(predictionsData);
      }

      // Fetch unique patients
      const patientsResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (patientsResponse.ok) {
        const usersData = await patientsResponse.json();
        // Filter to only show patients (users with predictions)
        const patientsWithPredictions = usersData.filter(user => 
          predictions.some(pred => pred.user === user._id)
        );
        setPatients(patientsWithPredictions);
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const addRecommendation = async (predictionId) => {
    if (!recommendation.trim()) {
      toast.error('Please enter a recommendation');
      return;
    }

    try {
      const response = await fetch(`/api/admin/predictions/${predictionId}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recommendation,
          doctorId: user._id,
          doctorName: user.name
        })
      });

      if (response.ok) {
        toast.success('Recommendation added successfully');
        setRecommendation('');
        setSelectedPrediction(null);
        fetchDoctorData(); // Refresh data
      } else {
        throw new Error('Failed to add recommendation');
      }
    } catch (error) {
      toast.error('Failed to add recommendation');
    }
  };

  const getRiskLevel = (probability) => {
    if (probability < 0.3) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (probability < 0.7) return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStats = () => {
    if (predictions.length === 0) return null;

    const total = predictions.length;
    const highRisk = predictions.filter(p => 
      getRiskLevel(p.predictionResult?.probability).level === 'High'
    ).length;
    const moderateRisk = predictions.filter(p => 
      getRiskLevel(p.predictionResult?.probability).level === 'Moderate'
    ).length;
    const lowRisk = predictions.filter(p => 
      getRiskLevel(p.predictionResult?.probability).level === 'Low'
    ).length;
    const withRecommendations = predictions.filter(p => 
      p.doctorRecommendations && p.doctorRecommendations.length > 0
    ).length;

    return { total, highRisk, moderateRisk, lowRisk, withRecommendations };
  };

  const filteredPredictions = predictions.filter(prediction => {
    const matchesSearch = prediction.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prediction.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || 
                       getRiskLevel(prediction.predictionResult?.probability).level.toLowerCase() === filterRisk.toLowerCase();
    
    return matchesSearch && matchesRisk;
  });

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Doctor Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, Dr. {user?.name}. Review patient predictions and provide medical recommendations.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Heart },
                { id: 'patients', label: 'Patients', icon: Users },
                { id: 'predictions', label: 'Predictions', icon: AlertTriangle },
                { id: 'recommendations', label: 'Recommendations', icon: MessageSquare }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Patients</p>
                    <p className="text-2xl font-semibold text-gray-900">{patients.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">High Risk Cases</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.highRisk || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Moderate Risk</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.moderateRisk || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">With Recommendations</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.withRecommendations || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent High-Risk Cases */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent High-Risk Cases</h2>
              </div>
              <div className="p-6">
                {predictions.filter(p => 
                  getRiskLevel(p.predictionResult?.probability).level === 'High'
                ).slice(0, 5).length > 0 ? (
                  <div className="space-y-4">
                    {predictions
                      .filter(p => getRiskLevel(p.predictionResult?.probability).level === 'High')
                      .slice(0, 5)
                      .map((prediction) => (
                        <div key={prediction._id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">
                              {prediction.user?.name || 'Unknown Patient'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Risk: {(prediction.predictionResult?.probability * 100).toFixed(1)}% • 
                              {formatDate(prediction.createdAt)}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedPrediction(prediction)}
                            className="btn btn-outline btn-sm"
                          >
                            Review
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No high-risk cases found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Patient List ({patients.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Prediction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => {
                    const patientPredictions = predictions.filter(p => p.user === patient._id);
                    const lastPrediction = patientPredictions[0]; // Assuming sorted by date
                    const riskInfo = lastPrediction ? getRiskLevel(lastPrediction.predictionResult?.probability) : null;
                    
                    return (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                              <div className="text-sm text-gray-500">{patient.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="space-y-1">
                            {patient.phone && (
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-2" />
                                {patient.phone}
                              </div>
                            )}
                            {patient.address && (
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                {patient.address}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lastPrediction ? formatDate(lastPrediction.createdAt) : 'No predictions'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {riskInfo ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskInfo.bgColor} ${riskInfo.color}`}>
                              {riskInfo.level} Risk
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-indigo-600 hover:text-indigo-900">
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="input"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="moderate">Moderate Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Probability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPredictions.map((prediction) => {
                    const riskInfo = getRiskLevel(prediction.predictionResult?.probability);
                    const hasRecommendations = prediction.doctorRecommendations && prediction.doctorRecommendations.length > 0;
                    
                    return (
                      <tr key={prediction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {prediction.user?.name || 'Unknown Patient'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {prediction.user?.email || 'No email'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskInfo.bgColor} ${riskInfo.color}`}>
                            {riskInfo.level} Risk
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(prediction.predictionResult?.probability * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(prediction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            hasRecommendations ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {hasRecommendations ? 'Reviewed' : 'Pending Review'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => setSelectedPrediction(prediction)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-indigo-600 hover:text-indigo-900">
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Medical Recommendations</h2>
            </div>
            <div className="p-6">
              {predictions.filter(p => p.doctorRecommendations && p.doctorRecommendations.length > 0).length > 0 ? (
                <div className="space-y-6">
                  {predictions
                    .filter(p => p.doctorRecommendations && p.doctorRecommendations.length > 0)
                    .map((prediction) => (
                      <div key={prediction._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {prediction.user?.name || 'Unknown Patient'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Prediction Date: {formatDate(prediction.createdAt)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getRiskLevel(prediction.predictionResult?.probability).bgColor
                          } ${
                            getRiskLevel(prediction.predictionResult?.probability).color
                          }`}>
                            {getRiskLevel(prediction.predictionResult?.probability).level} Risk
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {prediction.doctorRecommendations.map((rec, index) => (
                            <div key={index} className="bg-blue-50 p-3 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm text-blue-900">{rec.recommendation}</p>
                                  <p className="text-xs text-blue-700 mt-1">
                                    By Dr. {rec.doctorName} • {formatDate(rec.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recommendations have been added yet</p>
              )}
            </div>
          </div>
        )}

        {/* Recommendation Modal */}
        {selectedPrediction && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add Medical Recommendation
                </h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Patient:</strong> {selectedPrediction.user?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Risk Level:</strong> {getRiskLevel(selectedPrediction.predictionResult?.probability).level}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Probability:</strong> {(selectedPrediction.predictionResult?.probability * 100).toFixed(1)}%
                  </p>
                </div>
                
                <textarea
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="Enter your medical recommendation..."
                  rows={4}
                  className="input w-full mb-4"
                />
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedPrediction(null);
                      setRecommendation('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => addRecommendation(selectedPrediction._id)}
                    className="btn btn-primary"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Recommendation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
