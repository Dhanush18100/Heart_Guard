const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Prediction = require('../models/Prediction');

const router = express.Router();

// @desc    Search for nearby doctors and hospitals
// @route   GET /api/user/nearby-doctors
// @access  Private
router.get('/nearby-doctors', protect, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, type = 'doctor' } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Latitude and longitude are required' 
      });
    }

    // Use Google Places API to find nearby doctors/hospitals
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        message: 'Google Maps API key not configured' 
      });
    }

    const searchType = type === 'hospital' ? 'hospital' : 'doctor';
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius * 1000}&type=${searchType}&keyword=cardiologist&key=${apiKey}`;

    const response = await axios.get(url);
    const places = response.data.results || [];

    // Format the results
    const formattedPlaces = places.map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      location: place.geometry.location,
      rating: place.rating,
      types: place.types,
      photos: place.photos ? place.photos.slice(0, 3) : [],
      openNow: place.opening_hours?.open_now
    }));

    res.json({
      places: formattedPlaces,
      total: formattedPlaces.length,
      searchRadius: radius,
      searchType: type
    });
  } catch (error) {
    console.error('Nearby doctors search error:', error);
    res.status(500).json({ message: 'Error searching for nearby doctors' });
  }
});

// @desc    Get doctor details from Google Places API
// @route   GET /api/user/doctor-details/:placeId
// @access  Private
router.get('/doctor-details/:placeId', protect, async (req, res) => {
  try {
    const { placeId } = req.params;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        message: 'Google Maps API key not configured' 
      });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,reviews,opening_hours,photos&key=${apiKey}`;

    const response = await axios.get(url);
    const placeDetails = response.data.result;

    if (!placeDetails) {
      return res.status(404).json({ message: 'Doctor details not found' });
    }

    res.json({
      name: placeDetails.name,
      address: placeDetails.formatted_address,
      phone: placeDetails.formatted_phone_number,
      website: placeDetails.website,
      rating: placeDetails.rating,
      reviews: placeDetails.reviews || [],
      openingHours: placeDetails.opening_hours,
      photos: placeDetails.photos || []
    });
  } catch (error) {
    console.error('Doctor details fetch error:', error);
    res.status(500).json({ message: 'Error fetching doctor details' });
  }
});

// @desc    Get user's health summary
// @route   GET /api/user/health-summary
// @access  Private
router.get('/health-summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total predictions
    const totalPredictions = await Prediction.countDocuments({ user: userId });

    // Get latest prediction
    const latestPrediction = await Prediction.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .select('predictionResult createdAt');

    // Get risk level distribution
    const riskDistribution = await Prediction.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$predictionResult.riskLevel', count: { $sum: 1 } } }
    ]);

    // Get average probability
    const avgProbability = await Prediction.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, avgProb: { $avg: '$predictionResult.probability' } } }
    ]);

    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Prediction.aggregate([
      { $match: { user: userId, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          avgProbability: { $avg: '$predictionResult.probability' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalPredictions,
      latestPrediction,
      riskDistribution,
      averageProbability: avgProbability[0]?.avgProb || 0,
      monthlyTrend,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Health summary error:', error);
    res.status(500).json({ message: 'Error fetching health summary' });
  }
});

// @desc    Update user location
// @route   PUT /api/user/location
// @access  Private
router.put('/location', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Latitude and longitude are required' 
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.location.coordinates = [longitude, latitude];
    await user.save();

    res.json({ 
      message: 'Location updated successfully',
      location: user.location
    });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Error updating location' });
  }
});

// @desc    Get user's diet recommendations
// @route   GET /api/user/diet-recommendations
// @access  Private
router.get('/diet-recommendations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get latest prediction with diet plan
    const latestPrediction = await Prediction.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .select('dietPlan predictionResult createdAt');

    if (!latestPrediction) {
      return res.status(404).json({ 
        message: 'No predictions found. Please make a prediction first.' 
      });
    }

    // Get diet history for comparison
    const dietHistory = await Prediction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('dietPlan predictionResult createdAt');

    res.json({
      currentDietPlan: latestPrediction.dietPlan,
      currentRiskLevel: latestPrediction.predictionResult.riskLevel,
      dietHistory,
      lastUpdated: latestPrediction.createdAt
    });
  } catch (error) {
    console.error('Diet recommendations error:', error);
    res.status(500).json({ message: 'Error fetching diet recommendations' });
  }
});

// @desc    Export user data
// @route   GET /api/user/export-data
// @access  Private
router.get('/export-data', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user profile
    const user = await User.findById(userId).select('-password');
    
    // Get all predictions
    const predictions = await Prediction.find({ user: userId })
      .sort({ createdAt: -1 });

    const exportData = {
      userProfile: user,
      predictions: predictions,
      exportDate: new Date(),
      totalPredictions: predictions.length
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=health-data-${Date.now()}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ message: 'Error exporting user data' });
  }
});

// @desc    Get user statistics
// @route   GET /api/user/statistics
// @access  Private
router.get('/statistics', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get various statistics
    const stats = await Prediction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalPredictions: { $sum: 1 },
          avgProbability: { $avg: '$predictionResult.probability' },
          highRiskCount: {
            $sum: { $cond: [{ $eq: ['$predictionResult.riskLevel', 'high'] }, 1, 0] }
          },
          moderateRiskCount: {
            $sum: { $cond: [{ $eq: ['$predictionResult.riskLevel', 'moderate'] }, 1, 0] }
          },
          lowRiskCount: {
            $sum: { $cond: [{ $eq: ['$predictionResult.riskLevel', 'low'] }, 1, 0] }
          },
          heartDiseaseCount: {
            $sum: { $cond: ['$predictionResult.hasHeartDisease', 1, 0] }
          }
        }
      }
    ]);

    // Get file upload statistics
    const fileStats = await Prediction.aggregate([
      { $match: { user: userId, 'uploadedFile.filename': { $exists: true } } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          pdfCount: {
            $sum: { $cond: [{ $eq: ['$uploadedFile.mimetype', 'application/pdf'] }, 1, 0] }
          },
          imageCount: {
            $sum: { $cond: [{ $regexMatch: { input: '$uploadedFile.mimetype', regex: /^image\// } }, 1, 0] }
          }
        }
      }
    ]);

    const result = {
      predictions: stats[0] || {
        totalPredictions: 0,
        avgProbability: 0,
        highRiskCount: 0,
        moderateRiskCount: 0,
        lowRiskCount: 0,
        heartDiseaseCount: 0
      },
      files: fileStats[0] || {
        totalFiles: 0,
        pdfCount: 0,
        imageCount: 0
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router;
