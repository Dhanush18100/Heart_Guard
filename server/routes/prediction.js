const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PythonShell } = require('python-shell');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const { body, validationResult } = require('express-validator');
const Prediction = require('../models/Prediction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image (JPEG, JPG, PNG) and PDF files are allowed'));
    }
  }
});

// Helper function to extract health data from text
const extractHealthData = (text) => {
  const data = {};
  
  // Age extraction
  const ageMatch = text.match(/(?:age|Age|AGE)[\s:]*(\d+)/);
  if (ageMatch) data.age = parseInt(ageMatch[1]);
  
  // Gender extraction
  const genderMatch = text.match(/(?:gender|sex|Gender|Sex)[\s:]*([mfMF]|male|female|Male|Female)/i);
  if (genderMatch) {
    const gender = genderMatch[1].toLowerCase();
    data.sex = gender === 'm' || gender === 'male' ? 1 : 0;
  }
  
  // Blood pressure extraction
  const bpMatch = text.match(/(?:blood pressure|BP|bp)[\s:]*(\d+)/i);
  if (bpMatch) data.trestbps = parseInt(bpMatch[1]);
  
  // Cholesterol extraction
  const cholMatch = text.match(/(?:cholesterol|Chol|chol)[\s:]*(\d+)/i);
  if (cholMatch) data.chol = parseInt(cholMatch[1]);
  
  // Blood sugar extraction
  const bsMatch = text.match(/(?:blood sugar|glucose|sugar)[\s:]*(\d+)/i);
  if (bsMatch) {
    const sugar = parseInt(bsMatch[1]);
    data.fbs = sugar > 120 ? 1 : 0;
  }
  
  // Heart rate extraction
  const hrMatch = text.match(/(?:heart rate|HR|hr|pulse)[\s:]*(\d+)/i);
  if (hrMatch) data.thalach = parseInt(hrMatch[1]);
  
  // Default values for missing data
  const defaults = {
    cp: 0,        // Chest pain type
    restecg: 0,   // ECG results
    exang: 0,     // Exercise angina
    oldpeak: 0,   // ST depression
    slope: 0,     // ST slope
    ca: 0,        // Vessels
    thal: 0       // Thalassemia
  };
  
  return { ...defaults, ...data };
};

// Helper function to generate diet plan
const generateDietPlan = (riskLevel, hasHeartDisease) => {
  const basePlan = {
    general: "Maintain a heart-healthy diet with regular exercise and stress management.",
    foodsToInclude: [
      "Fresh fruits and vegetables",
      "Whole grains",
      "Lean proteins (fish, chicken, legumes)",
      "Healthy fats (olive oil, nuts, avocados)",
      "Low-fat dairy products"
    ],
    foodsToAvoid: [
      "Processed foods",
      "High sodium foods",
      "Saturated and trans fats",
      "Added sugars",
      "Excessive alcohol"
    ]
  };

  if (riskLevel === 'high' || hasHeartDisease) {
    return {
      ...basePlan,
      specific: "Strict low-sodium, low-cholesterol diet with emphasis on heart-protective foods.",
      foodsToInclude: [
        ...basePlan.foodsToInclude,
        "Oily fish (salmon, mackerel)",
        "Berries and dark chocolate (in moderation)",
        "Green tea",
        "Garlic and onions"
      ],
      foodsToAvoid: [
        ...basePlan.foodsToAvoid,
        "Red meat",
        "Full-fat dairy",
        "Fried foods",
        "Canned soups and processed meats"
      ],
      mealPlan: [
        "Breakfast: Oatmeal with berries and nuts",
        "Lunch: Grilled salmon with quinoa and vegetables",
        "Dinner: Lentil soup with whole grain bread",
        "Snacks: Apple with almond butter, carrot sticks"
      ]
    };
  } else if (riskLevel === 'moderate') {
    return {
      ...basePlan,
      specific: "Moderate heart-healthy diet with regular monitoring of key health metrics.",
      mealPlan: [
        "Breakfast: Greek yogurt with granola and fruit",
        "Lunch: Turkey sandwich on whole grain bread",
        "Dinner: Baked chicken with brown rice and vegetables",
        "Snacks: Mixed nuts, fruit smoothie"
      ]
    };
  } else {
    return {
      ...basePlan,
      specific: "Maintain current healthy habits with focus on prevention.",
      mealPlan: [
        "Breakfast: Smoothie bowl with granola",
        "Lunch: Mediterranean salad with olive oil dressing",
        "Dinner: Grilled fish with sweet potato and greens",
        "Snacks: Hummus with vegetables, dark chocolate"
      ]
    };
  }
};

// @desc    Make heart disease prediction from manual input
// @route   POST /api/prediction/manual
// @access  Private
router.post('/manual', protect, [
  body('age').isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('sex').isIn([0, 1]).withMessage('Sex must be 0 (Female) or 1 (Male)'),
  body('cp').isIn([0, 1, 2, 3]).withMessage('Chest pain type must be 0-3'),
  body('trestbps').isInt({ min: 80, max: 300 }).withMessage('Blood pressure must be between 80-300'),
  body('chol').isInt({ min: 100, max: 600 }).withMessage('Cholesterol must be between 100-600'),
  body('fbs').isIn([0, 1]).withMessage('Fasting blood sugar must be 0 or 1'),
  body('restecg').isIn([0, 1, 2]).withMessage('ECG results must be 0-2'),
  body('thalach').isInt({ min: 60, max: 250 }).withMessage('Heart rate must be between 60-250'),
  body('exang').isIn([0, 1]).withMessage('Exercise angina must be 0 or 1'),
  body('oldpeak').isFloat({ min: 0, max: 10 }).withMessage('ST depression must be between 0-10'),
  body('slope').isIn([0, 1, 2]).withMessage('ST slope must be 0-2'),
  body('ca').isIn([0, 1, 2, 3, 4]).withMessage('Vessels must be 0-4'),
  body('thal').isIn([0, 1, 2, 3]).withMessage('Thalassemia must be 0-3')
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

    const inputData = req.body;

    // Call Python ML model
    const options = {
      mode: 'json',
      pythonPath: process.env.PYTHON_PATH || 'python',
      pythonOptions: ['-u'],
      scriptPath: path.resolve(__dirname, '..', '..', 'ml_service'),
      args: [JSON.stringify(inputData)]
    };

    PythonShell.run('predict.py', options, async (err, results) => {
      if (err) {
        console.error('Python ML model error:', err);
        return res.status(500).json({ message: 'Error in ML model prediction' });
      }

      try {
        const prediction = results[0];
        const hasHeartDisease = prediction.prediction === 1;
        const probability = prediction.probability;
        
        // Determine risk level
        let riskLevel = 'low';
        if (probability > 0.7) riskLevel = 'high';
        else if (probability > 0.3) riskLevel = 'moderate';

        // Generate diet plan
        const dietPlan = generateDietPlan(riskLevel, hasHeartDisease);

        // Save prediction to database
        const predictionRecord = await Prediction.create({
          user: req.user._id,
          inputData,
          predictionResult: {
            hasHeartDisease,
            probability,
            riskLevel
          },
          dietPlan
        });

        res.json({
          prediction: predictionRecord,
          message: 'Prediction completed successfully'
        });
      } catch (error) {
        console.error('Prediction processing error:', error);
        res.status(500).json({ message: 'Error processing prediction results' });
      }
    });
  } catch (error) {
    console.error('Manual prediction error:', error);
    res.status(500).json({ message: 'Server error during prediction' });
  }
});

// @desc    Make heart disease prediction from uploaded file
// @route   POST /api/prediction/upload
// @access  Private
router.post('/upload', protect, upload.single('medicalReport'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a medical report file' });
    }

    let extractedText = '';
    const filePath = req.file.path;

    // Extract text based on file type
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      extractedText = data.text;
    } else {
      // Image file - use Tesseract OCR
      const result = await Tesseract.recognize(filePath, 'eng');
      extractedText = result.data.text;
    }

    // Extract health data from text
    const extractedData = extractHealthData(extractedText);

    // Check if we have enough data for prediction
    const requiredFields = ['age', 'sex', 'trestbps', 'chol', 'thalach'];
    const missingFields = requiredFields.filter(field => extractedData[field] === undefined);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Unable to extract required data. Missing: ${missingFields.join(', ')}`,
        extractedData,
        extractedText: extractedText.substring(0, 500) // First 500 chars for debugging
      });
    }

    // Call Python ML model with extracted data
    const options = {
      mode: 'json',
      pythonPath: process.env.PYTHON_PATH || 'python',
      pythonOptions: ['-u'],
      scriptPath: path.resolve(__dirname, '..', '..', 'ml_service'),
      args: [JSON.stringify(extractedData)]
    };

    PythonShell.run('predict.py', options, async (err, results) => {
      if (err) {
        console.error('Python ML model error:', err);
        return res.status(500).json({ message: 'Error in ML model prediction' });
      }

      try {
        const prediction = results[0];
        const hasHeartDisease = prediction.prediction === 1;
        const probability = prediction.probability;
        
        // Determine risk level
        let riskLevel = 'low';
        if (probability > 0.7) riskLevel = 'high';
        else if (probability > 0.3) riskLevel = 'moderate';

        // Generate diet plan
        const dietPlan = generateDietPlan(riskLevel, hasHeartDisease);

        // Save prediction to database
        const predictionRecord = await Prediction.create({
          user: req.user._id,
          inputData: extractedData,
          predictionResult: {
            hasHeartDisease,
            probability,
            riskLevel
          },
          dietPlan,
          uploadedFile: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
          }
        });

        res.json({
          prediction: predictionRecord,
          message: 'Prediction completed successfully from uploaded file',
          extractedData
        });
      } catch (error) {
        console.error('File prediction processing error:', error);
        res.status(500).json({ message: 'Error processing prediction results' });
      }
    });
  } catch (error) {
    console.error('File upload prediction error:', error);
    res.status(500).json({ message: 'Server error during file prediction' });
  }
});

// @desc    Get user's prediction history
// @route   GET /api/prediction/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const predictions = await Prediction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Prediction.countDocuments({ user: req.user._id });

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
    console.error('History fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching history' });
  }
});

// @desc    Get specific prediction by ID
// @route   GET /api/prediction/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id)
      .populate('user', 'name email')
      .populate('doctorRecommendations.doctor', 'name email role');

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    // Check if user owns this prediction or is admin/doctor
    if (prediction.user._id.toString() !== req.user._id.toString() && 
        !['admin', 'doctor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view this prediction' });
    }

    res.json(prediction);
  } catch (error) {
    console.error('Prediction fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching prediction' });
  }
});

module.exports = router;
