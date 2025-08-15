import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Heart, 
  Download, 
  Eye, 
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const History = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchPredictionHistory();
  }, []);

  const fetchPredictionHistory = async () => {
    try {
      const response = await fetch('/api/prediction/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : (Array.isArray(data.predictions) ? data.predictions : []);
        setPredictions(list);
      } else {
        throw new Error('Failed to fetch history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load prediction history');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevel = (probability) => {
    if (probability < 0.3) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (probability < 0.7) return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getRiskIcon = (probability) => {
    if (probability < 0.3) return <TrendingDown className="w-5 h-5 text-green-600" />;
    if (probability < 0.7) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <TrendingUp className="w-5 h-5 text-red-600" />;
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

  const downloadReport = (predictionId) => {
    // Implement report download functionality
    toast.success('Report download started');
  };

  const viewDetails = (prediction) => {
    navigate('/prediction-result', { state: { prediction } });
  };

  const filteredAndSortedPredictions = predictions
    .filter(prediction => {
      const matchesSearch = prediction.inputData?.age?.toString().includes(searchTerm) ||
                           prediction.inputData?.gender?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = filterRisk === 'all' || 
                         getRiskLevel(prediction.predictionResult?.probability).level.toLowerCase() === filterRisk.toLowerCase();
      
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'risk':
          return b.predictionResult?.probability - a.predictionResult?.probability;
        case 'age':
          return a.inputData?.age - b.inputData?.age;
        default:
          return 0;
      }
    });

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

    return { total, highRisk, moderateRisk, lowRisk };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prediction history...</p>
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
            Prediction History
          </h1>
          <p className="text-gray-600">
            Track your heart health predictions over time
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Risk</p>
                  <p className="text-2xl font-semibold text-green-600">{stats.lowRisk}</p>
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
                  <p className="text-2xl font-semibold text-yellow-600">{stats.moderateRisk}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Risk</p>
                  <p className="text-2xl font-semibold text-red-600">{stats.highRisk}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by age, gender..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            <div className="flex gap-4">
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

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input"
              >
                <option value="date">Sort by Date</option>
                <option value="risk">Sort by Risk</option>
                <option value="age">Sort by Age</option>
              </select>
            </div>
          </div>
        </div>

        {/* Predictions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Predictions ({filteredAndSortedPredictions.length})
            </h2>
          </div>

          {filteredAndSortedPredictions.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {predictions.length === 0 ? 'No predictions yet' : 'No predictions match your filters'}
              </h3>
              <p className="text-gray-500 mb-4">
                {predictions.length === 0 
                  ? 'Start by making your first heart disease prediction'
                  : 'Try adjusting your search criteria'
                }
              </p>
              {predictions.length === 0 && (
                <button
                  onClick={() => navigate('/prediction')}
                  className="btn btn-primary"
                >
                  Make First Prediction
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAndSortedPredictions.map((prediction) => {
                const riskInfo = getRiskLevel(prediction.predictionResult?.probability);
                return (
                  <div key={prediction._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${riskInfo.bgColor} ${riskInfo.color}`}>
                            {getRiskIcon(prediction.predictionResult?.probability)}
                            <span className="ml-1">{riskInfo.level} Risk</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(prediction.createdAt)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Age:</span>
                            <span className="ml-2 font-medium">{prediction.inputData?.age}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Gender:</span>
                            <span className="ml-2 font-medium">{prediction.inputData?.gender}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Probability:</span>
                            <span className="ml-2 font-medium">
                              {(prediction.predictionResult?.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Confidence:</span>
                            <span className="ml-2 font-medium">
                              {(prediction.predictionResult?.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {prediction.dietPlan && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-800">
                              <strong>Diet Plan:</strong> {prediction.dietPlan.title}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => viewDetails(prediction)}
                          className="btn btn-outline btn-sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadReport(prediction._id)}
                          className="btn btn-outline btn-sm"
                          title="Download Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/prediction')}
            className="btn btn-primary"
          >
            <Heart className="w-5 h-5 mr-2" />
            Make New Prediction
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;
