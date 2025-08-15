import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Heart, 
  Shield, 
  Brain, 
  Users, 
  BarChart3, 
  FileText,
  Zap,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Prediction',
      description: 'Advanced machine learning algorithms using Random Forest to predict heart disease risk with high accuracy.',
      color: 'text-blue-600'
    },
    {
      icon: FileText,
      title: 'Medical Report Analysis',
      description: 'Upload PDF or image reports for automatic data extraction and instant analysis.',
      color: 'text-green-600'
    },
    {
      icon: Users,
      title: 'Expert Recommendations',
      description: 'Get personalized diet plans and find nearby cardiologists for professional consultation.',
      color: 'text-purple-600'
    },
    {
      icon: BarChart3,
      title: 'Health Tracking',
      description: 'Monitor your health metrics over time with detailed analytics and progress tracking.',
      color: 'text-orange-600'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with enterprise-grade security measures.',
      color: 'text-red-600'
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get prediction results and recommendations in seconds, not days.',
      color: 'text-yellow-600'
    }
  ];

  const benefits = [
    'Early detection of heart disease risk factors',
    'Personalized diet and lifestyle recommendations',
    'Access to nearby cardiologists and hospitals',
    'Comprehensive health data analysis',
    'Regular health monitoring and tracking',
    'Professional medical insights and guidance'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-primary-100 rounded-full">
                <Heart className="h-12 w-12 text-primary-600" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Protect Your Heart with{' '}
              <span className="text-gradient">AI-Powered</span> Insights
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Advanced machine learning technology combined with medical expertise to predict heart disease risk 
              and provide personalized health recommendations. Your heart health, our priority.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/prediction"
                  className="btn-primary btn-lg text-lg px-8 py-4"
                >
                  Start New Prediction
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-primary btn-lg text-lg px-8 py-4"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="btn-outline btn-lg text-lg px-8 py-4"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full opacity-20"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-100 rounded-full opacity-20"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose HeartGuard?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive heart disease prediction system combines cutting-edge technology 
              with medical expertise to provide you with the most accurate health insights.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card p-6 hover:shadow-lg transition-shadow duration-300 group"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors mb-4`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your heart disease risk assessment in just three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Input Your Data
              </h3>
              <p className="text-gray-600">
                Enter your health metrics manually or upload medical reports for automatic data extraction
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-secondary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI Analysis
              </h3>
              <p className="text-gray-600">
                Our advanced ML model analyzes your data and predicts heart disease risk with high accuracy
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-success-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Get Results & Recommendations
              </h3>
              <p className="text-gray-600">
                Receive detailed results, personalized diet plans, and nearby doctor recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Take Control of Your Heart Health
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our AI-powered system provides comprehensive heart disease risk assessment, 
                personalized recommendations, and access to medical professionals - all in one place.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-success-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                {user ? (
                  <Link
                    to="/prediction"
                    className="btn-primary btn-lg inline-flex items-center"
                  >
                    Start New Assessment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="btn-primary btn-lg inline-flex items-center"
                  >
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>
            
            <div className="relative">
              <div className="card p-8 shadow-soft">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-10 w-10 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Sample Prediction
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Risk Level:</span>
                    <span className="badge-warning">Moderate</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Probability:</span>
                    <span className="text-gray-900 font-semibold">45%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Recommendation:</span>
                    <span className="text-gray-900 font-semibold">Diet + Exercise</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-success-50 rounded-lg border border-success-200">
                  <p className="text-sm text-success-800">
                    <strong>Tip:</strong> Regular monitoring and lifestyle changes can significantly reduce your risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Protect Your Heart?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of users who are already taking control of their heart health 
            with our AI-powered prediction system.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/prediction"
                className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg text-lg px-8 py-4"
              >
                Start New Prediction
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg text-lg px-8 py-4"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 btn-lg text-lg px-8 py-4"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
          
          <p className="text-primary-200 mt-6 text-sm">
            No credit card required • Free to use • Secure & private
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
