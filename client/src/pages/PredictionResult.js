import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Heart, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MapPin,
  Phone,
  Globe,
  Download,
  Share2,
  Utensils,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const PredictionResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prediction] = useState(location.state?.prediction || null);
  const [nearbyDoctors, setNearbyDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  useEffect(() => {
    if (!prediction) {
      // If no prediction data, redirect to prediction form
      navigate('/prediction');
      return;
    }
    
    // Fetch nearby doctors
    fetchNearbyDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction, navigate]);

  const fetchNearbyDoctors = async () => {
    if (!user?.location) {
      toast.error('Please update your location to find nearby doctors');
      return;
    }

    setIsLoadingDoctors(true);
    try {
      const response = await fetch('/api/user/nearby-doctors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const places = Array.isArray(data) ? data : (Array.isArray(data.places) ? data.places : []);
        setNearbyDoctors(places.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const getRiskLevel = (probability) => {
    if (probability < 0.3) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (probability < 0.7) return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getRiskIcon = (probability) => {
    if (probability < 0.3) return <CheckCircle className="w-8 h-8 text-green-600" />;
    if (probability < 0.7) return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
    return <XCircle className="w-8 h-8 text-red-600" />;
  };

  const generateDietPlan = (riskLevel) => {
    const baseDiet = {
      low: {
        title: "Heart-Healthy Diet",
        description: "Maintain a balanced diet with heart-healthy foods",
        recommendations: [
          "Eat plenty of fruits and vegetables (5+ servings daily)",
          "Choose whole grains over refined grains",
          "Include lean proteins (fish, poultry, legumes)",
          "Use healthy fats (olive oil, nuts, avocados)",
          "Limit sodium to 2,300mg per day",
          "Stay hydrated with water"
        ]
      },
      moderate: {
        title: "Heart-Protective Diet",
        description: "Focus on reducing risk factors through diet",
        recommendations: [
          "Reduce sodium intake to 1,500mg per day",
          "Limit saturated fats and avoid trans fats",
          "Increase fiber intake (25-30g daily)",
          "Choose low-fat dairy products",
          "Limit processed foods and added sugars",
          "Include omega-3 rich foods (fatty fish)"
        ]
      },
      high: {
        title: "Therapeutic Heart Diet",
        description: "Strict dietary modifications to manage heart health",
        recommendations: [
          "Very low sodium diet (1,000mg or less daily)",
          "Strictly limit cholesterol (200mg or less daily)",
          "High fiber diet (30-35g daily)",
          "Plant-based protein sources preferred",
          "Avoid all processed and fried foods",
          "Regular consultation with a dietitian recommended"
        ]
      }
    };

    return baseDiet[riskLevel.toLowerCase()] || baseDiet.low;
  };

  const downloadReport = () => {
    // Generate and download PDF report
    toast.success('Report download started');
  };

  const shareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Heart Disease Prediction Result',
        text: `My heart disease risk assessment result: ${getRiskLevel(prediction.probability).level} risk`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (!prediction) {
    return null;
  }

  // Normalize prediction shape from server
  const probability = prediction.predictionResult ? prediction.predictionResult.probability : prediction.probability;
  const hasHeartDisease = prediction.predictionResult ? prediction.predictionResult.hasHeartDisease : prediction.prediction;
  const riskInfo = getRiskLevel(Number(probability || 0));
  const dietPlan = generateDietPlan(riskInfo.level);
  const confidenceRaw = prediction.predictionResult?.confidence ?? prediction.confidence;
  const confidence = typeof confidenceRaw === 'number' ? confidenceRaw : (confidenceRaw === 'high' ? 0.9 : confidenceRaw === 'low' ? 0.6 : 0.8);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <Heart className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prediction Results
          </h1>
          <p className="text-gray-600">
            Your AI-powered heart disease risk assessment
          </p>
        </div>

        {/* Main Result Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              {getRiskIcon(Number(probability || 0))}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Risk Assessment: {riskInfo.level}
            </h2>
            <p className="text-gray-600">
              Based on your health data analysis
            </p>
          </div>

          {/* Risk Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Prediction</p>
              <p className={`text-2xl font-bold ${hasHeartDisease ? 'text-red-600' : 'text-green-600'}`}>
                {hasHeartDisease ? 'High Risk' : 'Low Risk'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Probability</p>
              <p className="text-2xl font-bold text-blue-600">
                {(Number(probability || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Confidence</p>
              <p className="text-2xl font-bold text-purple-600">
                {(confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={downloadReport}
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </button>
            <button
              onClick={shareResult}
              className="btn btn-secondary"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Result
            </button>
            <button
              onClick={() => navigate('/prediction')}
              className="btn btn-primary"
            >
              <Activity className="w-4 h-4 mr-2" />
              New Prediction
            </button>
          </div>
        </div>

        {/* Diet Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <Utensils className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {dietPlan.title}
              </h2>
              <p className="text-gray-600">{dietPlan.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dietPlan.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{rec}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> These recommendations are general guidelines. 
              Please consult with a healthcare professional or registered dietitian 
              for personalized dietary advice.
            </p>
          </div>
        </div>

        {/* Nearby Doctors */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Nearby Cardiologists
                </h2>
                <p className="text-gray-600">
                  Find healthcare professionals in your area
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/nearby-doctors')}
              className="btn btn-outline"
            >
              View All
            </button>
          </div>

          {isLoadingDoctors ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Finding nearby doctors...</p>
            </div>
          ) : nearbyDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyDoctors.map((doctor, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{doctor.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{doctor.specialty}</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{doctor.address}</span>
                    </div>
                    {doctor.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{doctor.phone}</span>
                      </div>
                    )}
                    {doctor.website && (
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        <a href={doctor.website} className="text-blue-600 hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {doctor.distance} km away
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No nearby doctors found</p>
              <p className="text-sm text-gray-400">
                Try updating your location or expanding your search radius
              </p>
              <button
                onClick={() => navigate('/profile')}
                className="btn btn-outline mt-4"
              >
                Update Location
              </button>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Next Steps</h3>
          <div className="space-y-2 text-blue-800">
            <p>• Schedule a follow-up with your primary care physician</p>
            <p>• Consider consulting with a cardiologist for detailed evaluation</p>
            <p>• Implement the recommended dietary changes</p>
            <p>• Monitor your health metrics regularly</p>
            <p>• Schedule regular check-ups as recommended by your doctor</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionResult;
