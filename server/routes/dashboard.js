const express = require('express');
const Prediction = require('../models/prediction'); 
const router = express.Router();

// GET DASHBOARD STATS
router.get('/dashboard-stats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get all predictions for this user
    const predictions = await Prediction.find({ user: userId })
      .sort({ createdAt: -1 });

    const lastPrediction = predictions[0] || null;

    res.json({
      totalPredictions: predictions.length,
      lastPrediction: lastPrediction ? lastPrediction.createdAt : null,
      riskLevel: lastPrediction ? lastPrediction.predictionResult.riskLevel : 'low',
      nextCheckup: null // You can compute or store this later
    });

  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({ error: "Server error, try again later" });
  }
});

module.exports = router;
