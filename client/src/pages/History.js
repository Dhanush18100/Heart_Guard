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
    if (probability < 0.3)
      return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (probability < 0.7)
      return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
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

  const downloadReport = () => {
    toast.success('Report download started');
  };

  const viewDetails = (prediction) => {
    navigate('/prediction-result', { state: { prediction } });
  };

  const filteredAndSortedPredictions = predictions
    .filter(prediction => {
      const sex = prediction.inputData?.sex;

      const gender = 
        sex === 1 ? "male" :
        sex === 0 ? "female" :
        (sex || "").toString().toLowerCase();

      const matchesSearch =
        prediction.inputData?.age?.toString().includes(searchTerm.toLowerCase()) ||
        gender.includes(searchTerm.toLowerCase());

      const matchesRisk =
        filterRisk === "all" ||
        getRiskLevel(prediction.predictionResult?.probability)
          .level.toLowerCase() === filterRisk.toLowerCase();

      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "risk":
          return b.predictionResult?.probability - a.predictionResult?.probability;
        case "age":
          return a.inputData?.age - b.inputData?.age;
        default:
          return 0;
      }
    });

  const getStats = () => {
    if (predictions.length === 0) return null;

    const total = predictions.length;

    const highRisk = predictions.filter(
      p => getRiskLevel(p.predictionResult?.probability).level === "High"
    ).length;

    const moderateRisk = predictions.filter(
      p => getRiskLevel(p.predictionResult?.probability).level === "Moderate"
    ).length;

    const lowRisk = predictions.filter(
      p => getRiskLevel(p.predictionResult?.probability).level === "Low"
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

        {/* ───────────────────────── HEADER ───────────────────────── */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prediction History
        </h1>
        <p className="text-gray-600 mb-8">
          Track your heart health predictions over time
        </p>

        {/* ──────────────────────── STATS CARDS ─────────────────────── */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Clock />} title="Total Predictions" value={stats.total} color="blue" />
            <StatCard icon={<TrendingDown />} title="Low Risk" value={stats.lowRisk} color="green" />
            <StatCard icon={<AlertTriangle />} title="Moderate Risk" value={stats.moderateRisk} color="yellow" />
            <StatCard icon={<TrendingUp />} title="High Risk" value={stats.highRisk} color="red" />
          </div>
        )}

        {/* ───────────────────────── FILTERS ───────────────────────── */}
        <Filters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterRisk={filterRisk}
          setFilterRisk={setFilterRisk}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* ──────────────────────── PREDICTION LIST ─────────────────────── */}
        <PredictionList
          predictions={filteredAndSortedPredictions}
          originalPredictions={predictions}
          navigate={navigate}
          viewDetails={viewDetails}
          downloadReport={downloadReport}
          formatDate={formatDate}
          getRiskLevel={getRiskLevel}
          getRiskIcon={getRiskIcon}
        />

        {/* ───────────────────────── ACTION BUTTON ───────────────────────── */}
        <div className="mt-8 text-center">
          <button onClick={() => navigate('/prediction')} className="btn btn-primary">
            <Heart className="w-5 h-5 mr-2" /> Make New Prediction
          </button>
        </div>

      </div>
    </div>
  );
};

/* ───────────────────────── COMPONENTS ───────────────────────── */

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center">
    <div className={`p-2 bg-${color}-100 rounded-lg`}>
      {React.cloneElement(icon, { className: `w-6 h-6 text-${color}-600` })}
    </div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className={`text-2xl font-semibold text-${color}-600`}>{value}</p>
    </div>
  </div>
);

const Filters = ({ searchTerm, setSearchTerm, filterRisk, setFilterRisk, sortBy, setSortBy }) => (
  <div className="bg-white rounded-lg shadow p-6 mb-8">
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by age or gender..."
          className="input pl-10 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <select className="input" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
        <option value="all">All Risk</option>
        <option value="low">Low Risk</option>
        <option value="moderate">Moderate Risk</option>
        <option value="high">High Risk</option>
      </select>

      <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="date">Sort by Date</option>
        <option value="risk">Sort by Risk</option>
        <option value="age">Sort by Age</option>
      </select>
    </div>
  </div>
);

const PredictionList = ({
  predictions,
  originalPredictions,
  navigate,
  viewDetails,
  downloadReport,
  formatDate,
  getRiskLevel,
  getRiskIcon
}) => (
  <div className="bg-white rounded-lg shadow">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">
        Recent Predictions ({predictions.length})
      </h2>
    </div>

    {predictions.length === 0 ? (
      <EmptyPredictions originalPredictions={originalPredictions} navigate={navigate} />
    ) : (
      <div className="divide-y divide-gray-200">
        {predictions.map((prediction) => (
          <PredictionRow
            key={prediction._id}
            prediction={prediction}
            viewDetails={viewDetails}
            downloadReport={downloadReport}
            formatDate={formatDate}
            getRiskLevel={getRiskLevel}
            getRiskIcon={getRiskIcon}
          />
        ))}
      </div>
    )}
  </div>
);

const EmptyPredictions = ({ originalPredictions, navigate }) => (
  <div className="text-center py-12">
    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {originalPredictions.length === 0 ? "No predictions yet" : "No predictions match filters"}
    </h3>
    <p className="text-gray-500 mb-4">
      {originalPredictions.length === 0
        ? "Start by making your first prediction"
        : "Try adjusting your filters"}
    </p>
    {originalPredictions.length === 0 && (
      <button onClick={() => navigate('/prediction')} className="btn btn-primary">
        Make First Prediction
      </button>
    )}
  </div>
);

const PredictionRow = ({
  prediction,
  viewDetails,
  downloadReport,
  formatDate,
  getRiskLevel,
  getRiskIcon
}) => {

  const riskInfo = getRiskLevel(prediction.predictionResult?.probability);

  // FIXED GENDER
  const sex = prediction.inputData?.sex;
  const gender =
    sex === 1 ? "Male" :
    sex === 0 ? "Female" :
    sex || "—";

  // FIXED CONFIDENCE
  const confidence =
    prediction.predictionResult?.confidence ??
    prediction.predictionResult?.confidenceScore ??
    prediction.predictionResult?.modelConfidence ??
    null;

  // FIXED DIET PLAN
  const diet = prediction.dietPlan ||
               prediction.diet_plan ||
               prediction.diet ||
               prediction.recommendations?.dietPlan ||
               null;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">

          {/* RISK BADGE */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${riskInfo.bgColor} ${riskInfo.color}`}>
              {getRiskIcon(prediction.predictionResult?.probability)}
              <span className="ml-1">{riskInfo.level} Risk</span>
            </div>

            <span className="text-sm text-gray-500">
              {formatDate(prediction.createdAt)}
            </span>
          </div>

          {/* DETAILS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Info label="Age" value={prediction.inputData?.age} />
            <Info label="Gender" value={gender} />

            <Info 
              label="Probability" 
              value={`${(prediction.predictionResult?.probability * 100).toFixed(1)}%`}
            />

            <Info 
              label="Confidence"
              value={confidence ? `${(confidence * 100).toFixed(1)}%` : "—"}
            />
          </div>

          {/* DIET PLAN FIX */}
          {diet && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 font-semibold">Diet Plan Available</p>

              {diet.title && (
                <p className="text-sm text-green-700 mt-1">➡ {diet.title}</p>
              )}

              {diet.general && (
                <p className="text-sm text-green-700 mt-1">➡ {diet.general}</p>
              )}
            </div>
          )}

        </div>

        <div className="flex gap-2 ml-4">
          <button onClick={() => viewDetails(prediction)} className="btn btn-outline btn-sm">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => downloadReport(prediction._id)} className="btn btn-outline btn-sm">
            <Download className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div>
    <span className="text-gray-600">{label}:</span>
    <span className="ml-2 font-medium">{value}</span>
  </div>
);

export default History;
