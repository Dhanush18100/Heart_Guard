const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PythonShell } = require('python-shell');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const { body, validationResult } = require('express-validator');
const Prediction = require('../models/prediction');
const { protect } = require('../middleware/auth');

const router = express.Router();


// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = 'uploads/';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const allowed = /jpeg|jpg|png|pdf/;
//     const validExt = allowed.test(path.extname(file.originalname).toLowerCase());
//     const validMime = allowed.test(file.mimetype);
//     validExt && validMime ? cb(null, true) : cb(new Error('File type not allowed'));
//   }
// });


  //EXTRACT HEALTH DATA FROM TEXT

const extractHealthData = (text) => {
  const data = {};

  const match = (regex) => {
    const m = text.match(regex);
    return m ? parseInt(m[1]) : undefined;
  };

  data.age = match(/(?:age|Age|AGE)[\s:]*(\d+)/);
  data.trestbps = match(/(?:blood pressure|BP|bp)[\s:]*(\d+)/);
  data.chol = match(/(?:cholesterol|Chol|chol)[\s:]*(\d+)/);
  data.thalach = match(/(?:heart rate|HR|hr|pulse)[\s:]*(\d+)/);

  // Gender
  const genderMatch = text.match(/(?:gender|sex)[\s:]*([mfMF]|male|female)/);
  if (genderMatch) {
    const g = genderMatch[1].toLowerCase();
    data.sex = g === 'm' || g === 'male' ? 1 : 0;
  }

  // Defaults
  return {
    cp: 0, restecg: 0, exang: 0, oldpeak: 0, slope: 0, ca: 0, thal: 0,
    ...data
  };
};

// DIET PLAN GENERATOR

const generateDietPlan = (riskLevel, hasHeartDisease) => {
  const base = {
    general: "Maintain heart-healthy diet.",
    foodsToInclude: ["Vegetables", "Fruits", "Whole grains"],
    foodsToAvoid: ["Trans fats", "Junk food"],
    mealPlan: []
  };

  if (riskLevel === "high") {
    return { ...base, specific: "Strict low sodium diet." };
  } else if (riskLevel === "moderate") {
    return { ...base, specific: "Moderate heart-healthy plan." };
  }
  return { ...base, specific: "Maintain healthy habits." };
};

/*****************************
 * ⭐ FIXED FALLBACK ML MODEL
 *****************************/
const fallbackPrediction = (input) => {
  const {
    age = 50, sex = 0, cp = 0, trestbps = 120, chol = 200,
    thalach = 150, exang = 0, oldpeak = 0
  } = input;

  // Balanced scoring — now allows low-risk scores too
  let score =
    -1.2 +
    0.03 * (age - 45) +
    0.02 * (trestbps - 120) +
    0.015 * (chol - 200) +
    -0.03 * (thalach - 150) +
    (sex === 1 ? 0.25 : -0.1) +
    (cp > 1 ? 0.15 : -0.05) +
    (exang === 1 ? 0.3 : -0.1) +
    (oldpeak * 0.5);

  // Sigmoid conversion → Probability between 0.05–0.95
  let prob = 1 / (1 + Math.exp(-score));
  prob = Math.max(0.05, Math.min(0.95, prob));

  const hasHeartDisease = prob > 0.5;
  let riskLevel = prob < 0.3 ? "low" : prob < 0.7 ? "moderate" : "high";

  return { prob, hasHeartDisease, riskLevel };
};

/*****************************
 * ⭐ FIXED MANUAL PREDICTION ROUTE
 *****************************/
router.post(
  '/manual',
  protect,
  [
    body('age').isInt({ min: 1, max: 120 }),
    body('sex').isIn([0, 1]),
    body('cp').isIn([0, 1, 2, 3]),
    body('trestbps').isInt(),
    body('chol').isInt(),
    body('thalach').isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const inputData = req.body;
    let responded = false;

    // Timeout fallback
    const timeout = setTimeout(async () => {
      if (responded) return;
      responded = true;

      const { prob, hasHeartDisease, riskLevel } = fallbackPrediction(inputData);
      const dietPlan = generateDietPlan(riskLevel, hasHeartDisease);

      const prediction = await Prediction.create({
        user: req.user._id,
        inputData,
        predictionResult: { probability: prob, hasHeartDisease, riskLevel },
        dietPlan
      });

      return res.json({ prediction, message: "Timeout fallback" });
    }, 8000);

    // Run Python Model
    PythonShell.run(
      "predict.py",
      {
        mode: "json",
        pythonPath: process.env.PYTHON_PATH || "python",
        scriptPath: path.resolve(__dirname, "..", "..", "ml_service"),
        args: [JSON.stringify(inputData)]
      },
      async (err, results) => {
        if (responded) return;
        responded = true;
        clearTimeout(timeout);

        if (err || !Array.isArray(results) || !results[0]?.probability) {
          // Use fallback
          const { prob, hasHeartDisease, riskLevel } = fallbackPrediction(inputData);
          const dietPlan = generateDietPlan(riskLevel, hasHeartDisease);

          const prediction = await Prediction.create({
            user: req.user._id,
            inputData,
            predictionResult: { probability: prob, hasHeartDisease, riskLevel },
            dietPlan
          });

          return res.json({ prediction, message: "Fallback model used" });
        }

        // Python success
        const py = results[0];
        const prob = Math.max(0.05, Math.min(0.95, Number(py.probability)));

        const hasHeartDisease = prob > 0.5;
        const riskLevel = prob < 0.3 ? "low" : prob < 0.7 ? "moderate" : "high";
        const dietPlan = generateDietPlan(riskLevel, hasHeartDisease);

        const prediction = await Prediction.create({
          user: req.user._id,
          inputData,
          predictionResult: { probability: prob, hasHeartDisease, riskLevel },
          dietPlan
        });

        res.json({ prediction, message: "Prediction successful" });
      }
    );
  }
);

// Get History
router.get('/history', protect, async (req, res) => {
  const predictions = await Prediction.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ predictions });
});

module.exports = router;
