const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inputData: {
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120
    },
    sex: {
      type: Number,
      required: true,
      enum: [0, 1] // 0: Female, 1: Male
    },
    cp: {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3] // Chest pain type
    },
    trestbps: {
      type: Number,
      required: true,
      min: 80,
      max: 300 // Resting blood pressure
    },
    chol: {
      type: Number,
      required: true,
      min: 100,
      max: 600 // Serum cholesterol
    },
    fbs: {
      type: Number,
      required: true,
      enum: [0, 1] // Fasting blood sugar > 120 mg/dl
    },
    restecg: {
      type: Number,
      required: true,
      enum: [0, 1, 2] // Resting electrocardiographic results
    },
    thalach: {
      type: Number,
      required: true,
      min: 60,
      max: 250 // Maximum heart rate achieved
    },
    exang: {
      type: Number,
      required: true,
      enum: [0, 1] // Exercise induced angina
    },
    oldpeak: {
      type: Number,
      required: true,
      min: 0,
      max: 10 // ST depression induced by exercise
    },
    slope: {
      type: Number,
      required: true,
      enum: [0, 1, 2] // Slope of peak exercise ST segment
    },
    ca: {
      type: Number,
      required: true,
      min: 0,
      max: 4 // Number of major vessels colored by fluoroscopy
    },
    thal: {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3] // Thalassemia
    }
  },
  predictionResult: {
    hasHeartDisease: {
      type: Boolean,
      required: true
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    riskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      required: true
    }
  },
  dietPlan: {
    general: {
      type: String,
      required: true
    },
    specific: {
      type: String
    },
    foodsToAvoid: [String],
    foodsToInclude: [String],
    mealPlan: [String]
  },
  doctorRecommendations: [{
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recommendation: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  uploadedFile: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
predictionSchema.index({ user: 1, createdAt: -1 });
predictionSchema.index({ 'predictionResult.riskLevel': 1 });
predictionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
