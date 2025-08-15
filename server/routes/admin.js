const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Prediction = require('../models/Prediction');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// All routes require admin or doctor role
router.use(protect);
router.use(authorize('admin', 'doctor'));

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Admin only
router.get('/users', authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// @desc    Get user details with predictions
// @route   GET /api/admin/users/:userId
// @access  Admin/Doctor
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's predictions
    const predictions = await Prediction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get prediction statistics
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
          }
        }
      }
    ]);

    res.json({
      user,
      predictions,
      statistics: stats[0] || {
        totalPredictions: 0,
        avgProbability: 0,
        highRiskCount: 0,
        moderateRiskCount: 0,
        lowRiskCount: 0
      }
    });
  } catch (error) {
    console.error('User details fetch error:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});

// @desc    Get all predictions (admin/doctor view)
// @route   GET /api/admin/predictions
// @access  Admin/Doctor
router.get('/predictions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const riskLevel = req.query.riskLevel;
    const hasHeartDisease = req.query.hasHeartDisease;

    let query = {};
    if (riskLevel) {
      query['predictionResult.riskLevel'] = riskLevel;
    }
    if (hasHeartDisease !== undefined) {
      query['predictionResult.hasHeartDisease'] = hasHeartDisease === 'true';
    }

    const predictions = await Prediction.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Prediction.countDocuments(query);

    res.json({
      predictions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Predictions fetch error:', error);
    res.status(500).json({ message: 'Error fetching predictions' });
  }
});

// @desc    Get prediction details
// @route   GET /api/admin/predictions/:predictionId
// @access  Admin/Doctor
router.get('/predictions/:predictionId', async (req, res) => {
  try {
    const { predictionId } = req.params;

    const prediction = await Prediction.findById(predictionId)
      .populate('user', 'name email role phone address')
      .populate('doctorRecommendations.doctor', 'name email role');

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    res.json(prediction);
  } catch (error) {
    console.error('Prediction details fetch error:', error);
    res.status(500).json({ message: 'Error fetching prediction details' });
  }
});

// @desc    Add doctor recommendation to prediction
// @route   POST /api/admin/predictions/:predictionId/recommendations
// @access  Admin/Doctor
router.post('/predictions/:predictionId/recommendations', [
  body('recommendation').notEmpty().trim().withMessage('Recommendation is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { predictionId } = req.params;
    const { recommendation } = req.body;

    const prediction = await Prediction.findById(predictionId);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    // Add recommendation
    prediction.doctorRecommendations.push({
      doctor: req.user._id,
      recommendation,
      date: new Date()
    });

    await prediction.save();

    // Populate doctor info for response
    await prediction.populate('doctorRecommendations.doctor', 'name email role');

    res.json({
      message: 'Recommendation added successfully',
      prediction
    });
  } catch (error) {
    console.error('Recommendation add error:', error);
    res.status(500).json({ message: 'Error adding recommendation' });
  }
});

// @desc    Update user role (admin only)
// @route   PUT /api/admin/users/:userId/role
// @access  Admin only
router.put('/users/:userId/role', authorize('admin'), [
  body('role').isIn(['user', 'admin', 'doctor']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// @desc    Toggle user active status (admin only)
// @route   PUT /api/admin/users/:userId/status
// @access  Admin only
router.put('/users/:userId/status', authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Status toggle error:', error);
    res.status(500).json({ message: 'Error toggling user status' });
  }
});

// @desc    Get system statistics (admin only)
// @route   GET /api/admin/statistics
// @access  Admin only
router.get('/statistics', authorize('admin'), async (req, res) => {
  try {
    // Get overall statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalPredictions = await Prediction.countDocuments();

    // Get user role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get prediction risk distribution
    const riskDistribution = await Prediction.aggregate([
      { $group: { _id: '$predictionResult.riskLevel', count: { $sum: 1 } } }
    ]);

    // Get monthly user growth (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyUserGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get monthly prediction growth
    const monthlyPredictionGrowth = await Prediction.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newPredictions: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalPredictions,
        inactiveUsers: totalUsers - activeUsers
      },
      roleDistribution,
      riskDistribution,
      monthlyUserGrowth,
      monthlyPredictionGrowth,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('System statistics error:', error);
    res.status(500).json({ message: 'Error fetching system statistics' });
  }
});

// @desc    Get high-risk predictions (for doctors to review)
// @route   GET /api/admin/high-risk-predictions
// @access  Admin/Doctor
router.get('/high-risk-predictions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const highRiskPredictions = await Prediction.find({
      'predictionResult.riskLevel': 'high'
    })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Prediction.countDocuments({
      'predictionResult.riskLevel': 'high'
    });

    res.json({
      predictions: highRiskPredictions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('High-risk predictions fetch error:', error);
    res.status(500).json({ message: 'Error fetching high-risk predictions' });
  }
});

module.exports = router;
