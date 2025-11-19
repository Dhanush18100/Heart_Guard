const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const predictionRoutes = require('./routes/prediction');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');



const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting (important for accurate IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());


// Rate limiting with proper configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
// app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/heart-disease-prediction', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  console.log('Database:', process.env.MONGODB_URI || 'mongodb://localhost:27017/heart-disease-prediction');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.error('Please check if MongoDB is running and the connection string is correct');
  process.exit(1); // Exit if we can't connect to database
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/user', userRoutes);

app.use('/api', dashboardRoutes);





// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Test endpoint for debugging
app.post('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  res.json({ 
    status: 'OK', 
    message: 'Test endpoint working',
    body: req.body,
    headers: req.headers
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
