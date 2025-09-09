const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'devsecret';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('gender').optional().custom(value => {
    if (value === '' || value === undefined || value === null) return true;
    return ['male', 'female', 'other'].includes(value);
  }).withMessage('Invalid gender'),
  body('phone').optional().custom(value => {
    if (value === '' || value === undefined || value === null) return true;
    return /^[\+]?[\d\s\-\(\)]{7,20}$/.test(value);
  }).withMessage('Invalid phone number'),
  body('dateOfBirth').optional().custom(value => {
    if (value === '' || value === undefined || value === null) return true;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }).withMessage('Invalid date format')
], async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    
    // Check if request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        message: 'Request body is required' 
      });
    }
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, password, gender, phone, dateOfBirth } = req.body;
    
    console.log('Processed registration data:', { name, email, gender, phone, dateOfBirth });

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Process dateOfBirth if provided
    let processedDateOfBirth = dateOfBirth;
    if (dateOfBirth && typeof dateOfBirth === 'string') {
      const date = new Date(dateOfBirth);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      processedDateOfBirth = date;
    }
    
    // Process gender - only include if it's not an empty string
    let processedGender = gender;
    if (gender === '') {
      processedGender = undefined;
    }
    
    // Process phone - only include if it's not an empty string
    let processedPhone = phone;
    if (phone === '') {
      processedPhone = undefined;
    }
    
    // Create user
    const userData = {
      name,
      email,
      password,
      gender: processedGender,
      phone: processedPhone,
      dateOfBirth: processedDateOfBirth
    };
    
    console.log('Creating user with data:', userData);
    
    try {
      const user = await User.create(userData);
      
      if (user) {
        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id)
        });
      } else {
        res.status(400).json({ message: 'Invalid user data' });
      }
    } catch (mongooseError) {
      console.error('Mongoose validation error:', mongooseError);
      
      // Handle Mongoose validation errors
      if (mongooseError.name === 'ValidationError') {
        const validationErrors = Object.values(mongooseError.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      // Handle duplicate key errors
      if (mongooseError.code === 11000) {
        return res.status(400).json({
          message: 'User already exists with this email'
        });
      }
      
      throw mongooseError; // Re-throw other errors
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('gender').optional().isString().customSanitizer(v => String(v).toLowerCase()).isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('phone').optional().matches(/^[\+]?([\d\s\-\(\)]){7,20}$/).withMessage('Invalid phone number')
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

    const { name, gender, phone, address, dateOfBirth } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (phone) user.phone = phone;
    if (address) {
      // Accept string or object; map string to address.street
      if (typeof address === 'string') {
        user.address = { street: address };
      } else if (typeof address === 'object') {
        user.address = address;
      }
    }
    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      if (!isNaN(d.getTime())) user.dateOfBirth = d;
    }

    const updatedUser = await user.save();

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// @desc    Update user location
// @route   PUT /api/auth/location
// @access  Private
router.put('/location', protect, [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
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

    const { latitude, longitude } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.location.coordinates = [longitude, latitude];
    await user.save();

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Server error while updating location' });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
});

module.exports = router;
