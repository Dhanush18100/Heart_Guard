const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { PASSWORD_RESET_TEMPLATE } = require('../config/emailTemplates');
const transporter = require('../config/nodemailer');
const bcrypt = require('bcryptjs');


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

//password reset otp
router.post('/sent-reset-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    };

    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "OTP sent to your email" });

  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});


router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: "Email, OTP, and new password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }

    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();

    return res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});


router.post('/verify-reset-otp', async (req, res) => {
  const { email, otp } = req.body;
 


  if (!email || !otp) {
    return res.json({ success: false, message: "Email and OTP are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if OTP exists and matches
    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // Check if OTP has expired
    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }

    return res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.json({ success: false, message: error.message });
  }
});


module.exports = router;
