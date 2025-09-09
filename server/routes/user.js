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
      return res.json({ places: [], total: 0, searchRadius: radius, searchType: type, note: 'Google Maps API key not configured' });
    }

    const searchType = type === 'hospital' ? 'hospital' : 'doctor';
    const tried = [];
    let places = [];

    const queries = [
      { kind: 'nearby', url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius * 1000}&type=${searchType}&key=${apiKey}` },
      { kind: 'nearby_hospital', url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius * 1000}&type=hospital&key=${apiKey}` },
      { kind: 'text_cardiologist', url: `https://maps.googleapis.com/maps/api/place/textsearch/json?query=cardiologist&location=${latitude},${longitude}&radius=${radius * 1000}&key=${apiKey}` },
      { kind: 'text_hospital', url: `https://maps.googleapis.com/maps/api/place/textsearch/json?query=hospital&location=${latitude},${longitude}&radius=${radius * 1000}&key=${apiKey}` }
    ];

    for (const q of queries) {
      try {
        const r = await axios.get(q.url);
        tried.push({ kind: q.kind, status: r.data.status, count: (r.data.results || []).length, error: r.data.error_message });
        if (Array.isArray(r.data.results) && r.data.results.length > 0) {
          places = r.data.results;
          break;
        }
      } catch (err) {
        tried.push({ kind: q.kind, error: err?.response?.data?.error_message || err.message });
      }
    }

    // If legacy is denied or empty, try Places API (New)
    const deniedLegacy = tried.some(t => t.status === 'REQUEST_DENIED' || (t.error && String(t.error).includes('legacy')));
    if ((!places || places.length === 0) && deniedLegacy) {
      try {
        const meters = Math.min(Math.max(Number(radius) * 1000, 1000), 50000);
        const body = {
          locationRestriction: {
            circle: {
              center: { latitude: Number(latitude), longitude: Number(longitude) },
              radius: meters
            }
          },
          includedTypes: type === 'hospital' ? ['hospital'] : ['doctor', 'health'],
          maxResultCount: 20,
          rankPreference: 'RELEVANCE'
        };
        const headers = {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types,places.currentOpeningHours'
        };
        const r = await axios.post('https://places.googleapis.com/v1/places:searchNearby', body, { headers });
        tried.push({ kind: 'v1_searchNearby', count: (r.data.places || []).length });
        if (Array.isArray(r.data.places) && r.data.places.length > 0) {
          places = r.data.places.map(p => ({
            place_id: p.id,
            name: p.displayName?.text,
            formatted_address: p.formattedAddress,
            geometry: { location: p.location },
            rating: p.rating,
            types: p.types,
            opening_hours: { open_now: p.currentOpeningHours?.openNow }
          }));
        } else {
          // Try text search as a fallback in v1
          const tBody = {
            textQuery: type === 'hospital' ? 'hospital' : 'cardiologist',
            locationBias: {
              circle: {
                center: { latitude: Number(latitude), longitude: Number(longitude) },
                radius: meters
              }
            }
          };
          const tHeaders = {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types,places.currentOpeningHours'
          };
          const tr = await axios.post('https://places.googleapis.com/v1/places:searchText', tBody, { headers: tHeaders });
          tried.push({ kind: 'v1_searchText', count: (tr.data.places || []).length });
          if (Array.isArray(tr.data.places)) {
            places = tr.data.places.map(p => ({
              place_id: p.id,
              name: p.displayName?.text,
              formatted_address: p.formattedAddress,
              geometry: { location: p.location },
              rating: p.rating,
              types: p.types,
              opening_hours: { open_now: p.currentOpeningHours?.openNow }
            }));
          }
        }
      } catch (v1err) {
        tried.push({ kind: 'v1_error', error: v1err?.response?.data?.error?.message || v1err.message });
      }
    }

    // Format the results
    let formattedPlaces = places.map(place => ({
      id: place.place_id || place.id,
      name: place.name,
      address: place.vicinity || place.formatted_address || place.formattedAddress,
      location: place.geometry?.location || place.location,
      rating: place.rating,
      types: place.types,
      photos: place.photos ? place.photos.slice(0, 3) : [],
      openNow: place.opening_hours?.open_now || place.currentOpeningHours?.openNow
    }));

    // Manual fallback when no results (for testing/demo)
    if (!formattedPlaces || formattedPlaces.length === 0) {
      const latNum = Number(latitude) || 40.7484;
      const lngNum = Number(longitude) || -73.9857;
      formattedPlaces = [
        {
          id: 'demo-1',
          name: 'City Heart Clinic',
          address: '123 Wellness Ave',
          location: { lat: latNum + 0.005, lng: lngNum + 0.005 },
          rating: 4.6,
          types: ['doctor', 'health'],
          photos: [],
          openNow: true
        },
        {
          id: 'demo-2',
          name: 'Care Cardiology Center',
          address: '45 Cardio Blvd',
          location: { lat: latNum - 0.004, lng: lngNum + 0.003 },
          rating: 4.4,
          types: ['doctor', 'health'],
          photos: [],
          openNow: false
        },
        {
          id: 'demo-3',
          name: 'Metro General Hospital',
          address: '789 Health St',
          location: { lat: latNum + 0.007, lng: lngNum - 0.006 },
          rating: 4.2,
          types: ['hospital', 'health'],
          photos: [],
          openNow: true
        }
      ];
      tried.push({ kind: 'manual_fallback', count: formattedPlaces.length });
    }

    return res.json({
      places: formattedPlaces,
      total: formattedPlaces.length,
      searchRadius: radius,
      searchType: type,
      debug: tried
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
      return res.status(404).json({ message: 'Doctor details not available (API key missing)' });
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
