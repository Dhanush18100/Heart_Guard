import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Heart, ArrowRight, CheckCircle } from 'lucide-react';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      console.log('Form data received:', data);
      
      // Combine firstName and lastName into name field
      const registrationData = {
        ...data,
        name: `${data.firstName} ${data.lastName}`.trim()
      };
      
      // Remove firstName and lastName from the data sent to backend
      delete registrationData.firstName;
      delete registrationData.confirmPassword;
      delete registrationData.terms;
      
      console.log('Data being sent to backend:', registrationData);
      
      const result = await registerUser(registrationData);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    'AI-powered heart disease risk assessment',
    'Personalized diet and lifestyle recommendations',
    'Secure health data storage and tracking',
    'Regular health monitoring and insights',
    'Professional medical guidance and support'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Registration Form */}
          <div className="lg:order-2">
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-primary-100 rounded-full">
                    <Heart className="h-12 w-12 text-primary-600" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Join HeartGuard
                </h2>
                <p className="text-gray-600">
                  Create your account and start your heart health journey
                </p>
              </div>

              {/* Registration Form */}
              <div className="card">
                <div className="card-body">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label htmlFor="firstName" className="label">
                          First Name
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          autoComplete="given-name"
                          className={`input ${errors.firstName ? 'input-error' : ''}`}
                          placeholder="First name"
                          {...register('firstName', {
                            required: 'First name is required',
                            minLength: {
                              value: 2,
                              message: 'First name must be at least 2 characters'
                            }
                          })}
                        />
                        {errors.firstName && (
                          <p className="form-error">{errors.firstName.message}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="lastName" className="label">
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          autoComplete="family-name"
                          className={`input ${errors.lastName ? 'input-error' : ''}`}
                          placeholder="Last name"
                          {...register('lastName', {
                            required: 'Last name is required',
                            minLength: {
                              value: 2,
                              message: 'Last name must be at least 2 characters'
                            }
                          })}
                        />
                        {errors.lastName && (
                          <p className="form-error">{errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="form-group">
                      <label htmlFor="email" className="label">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        className={`input ${errors.email ? 'input-error' : ''}`}
                        placeholder="Enter your email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                      />
                      {errors.email && (
                        <p className="form-error">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Password Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label htmlFor="password" className="label">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                            placeholder="Create password"
                            {...register('password', {
                              required: 'Password is required',
                              minLength: {
                                value: 6,
                                message: 'Password must be at least 6 characters'
                              }
                            })}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="form-error">{errors.password.message}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirmPassword" className="label">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                            placeholder="Confirm password"
                            {...register('confirmPassword', {
                              required: 'Please confirm your password',
                              validate: value => value === password || 'Passwords do not match'
                            })}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="form-error">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Additional Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label htmlFor="gender" className="label">
                          Gender
                        </label>
                        <select
                          id="gender"
                          className="input"
                          {...register('gender')}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="dateOfBirth" className="label">
                          Date of Birth
                        </label>
                        <input
                          id="dateOfBirth"
                          type="date"
                          className="input"
                          {...register('dateOfBirth')}
                        />
                      </div>
                    </div>

                    {/* Phone Field */}
                    <div className="form-group">
                      <label htmlFor="phone" className="label">
                        Phone Number (Optional)
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        className="input"
                        placeholder="Enter phone number"
                        {...register('phone')}
                      />
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex items-start">
                      <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                        {...register('terms', {
                          required: 'You must accept the terms and conditions'
                        })}
                      />
                      <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                        I agree to the{' '}
                        <a href="#" className="text-primary-600 hover:text-primary-500">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-primary-600 hover:text-primary-500">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                    {errors.terms && (
                      <p className="form-error">{errors.terms.message}</p>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full btn-lg flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="loading-spinner h-5 w-5"></div>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    {/* Social Registration Buttons */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="btn-outline w-full flex items-center justify-center"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span className="ml-2">Google</span>
                      </button>

                      <button
                        type="button"
                        className="btn-outline w-full flex items-center justify-center"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                        </svg>
                        <span className="ml-2">Twitter</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sign In Link */}
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Benefits */}
          <div className="lg:order-1">
            <div className="max-w-lg">
              <div className="text-center lg:text-left mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Start Your Heart Health Journey Today
                </h1>
                <p className="text-xl text-gray-600">
                  Join thousands of users who are already taking control of their heart health 
                  with our AI-powered prediction system.
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  What you'll get with HeartGuard:
                </h3>
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-success-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Why Trust HeartGuard?</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• HIPAA compliant data protection</p>
                  <p>• Medical-grade accuracy (95%+)</p>
                  <p>• Endorsed by cardiologists</p>
                  <p>• 24/7 customer support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
