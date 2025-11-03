import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Upload, 
  FileText, 
  Heart, 
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const PredictionForm = () => {
  const navigate = useNavigate();
  const [inputMethod, setInputMethod] = useState('manual'); // 'manual' or 'upload'
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('simple'); // 'simple' | 'advanced'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const simpleFields = [
    { name: 'age', label: 'Age', type: 'number', min: 1, max: 120, required: true },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: true },
    { name: 'chestPainType', label: 'Chest Pain Type', type: 'select', options: ['Typical Angina', 'Atypical Angina', 'Non-anginal Pain', 'Asymptomatic'], required: true },
    { name: 'restingBp', label: 'Resting Blood Pressure (mm Hg)', type: 'number', min: 90, max: 200, required: true },
    { name: 'cholesterol', label: 'Cholesterol (mg/dl)', type: 'number', min: 100, max: 600, required: true },
    { name: 'maxHr', label: 'Max Heart Rate', type: 'number', min: 60, max: 202, required: true },
    { name: 'exerciseAngina', label: 'Exercise Induced Angina', type: 'select', options: ['Yes', 'No'], required: true },
    { name: 'oldpeak', label: 'ST Depression (oldpeak)', type: 'number', min: 0, max: 6.2, step: 0.1, required: true }
  ];

  const advancedOnlyFields = [
    { name: 'fastingBs', label: 'Fasting Blood Sugar > 120 mg/dl', type: 'select', options: ['Yes', 'No'], required: true },
    { name: 'restingEcg', label: 'Resting ECG Results', type: 'select', options: ['Normal', 'ST-T Wave Abnormality', 'Left Ventricular Hypertrophy'], required: true },
    { name: 'slope', label: 'Slope of Peak Exercise ST Segment', type: 'select', options: ['Upsloping', 'Flat', 'Downsloping'], required: true },
    { name: 'ca', label: 'Major Vessels (0-4)', type: 'number', min: 0, max: 4, required: true },
    { name: 'thal', label: 'Thalassemia', type: 'select', options: ['Normal', 'Fixed Defect', 'Reversable Defect'], required: true }
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      // Simulate data extraction
      setTimeout(() => {
        const mockExtracted = {
          age: 45,
          gender: 'Male',
          chestPainType: 'Typical Angina',
          restingBp: 140,
          cholesterol: 220,
          fastingBs: 'Yes',
          restingEcg: 'Normal',
          maxHr: 150,
          exerciseAngina: 'No',
          oldpeak: 1.5,
          slope: 'Flat',
          ca: 1,
          thal: 'Fixed Defect'
        };
        setExtractedData(mockExtracted);
        toast.success('Data extracted successfully from report!');
      }, 2000);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Map form fields to backend expected keys and numeric encodings
      const cpMap = { 'Typical Angina': 0, 'Atypical Angina': 1, 'Non-anginal Pain': 2, 'Asymptomatic': 3 };
      const restEcgMap = { 'Normal': 0, 'ST-T Wave Abnormality': 1, 'Left Ventricular Hypertrophy': 2 };
      const slopeMap = { 'Upsloping': 0, 'Flat': 1, 'Downsloping': 2 };
      const thalMap = { 'Normal': 0, 'Fixed Defect': 1, 'Reversable Defect': 2 };

      // Defaults for simple mode
      const defaults = {
        fbs: 0,
        restecg: 0,
        slope: 1,
        ca: 0,
        thal: 0
      };

      const base = {
        age: Number(data.age),
        sex: data.gender === 'Male' ? 1 : 0,
        cp: cpMap[data.chestPainType],
        trestbps: Number(data.restingBp),
        chol: Number(data.cholesterol),
        fbs: data.fastingBs ? (data.fastingBs === 'Yes' ? 1 : 0) : undefined,
        restecg: data.restingEcg ? restEcgMap[data.restingEcg] : undefined,
        thalach: Number(data.maxHr),
        exang: data.exerciseAngina === 'Yes' ? 1 : 0,
        oldpeak: Number(data.oldpeak),
        slope: data.slope ? slopeMap[data.slope] : undefined,
        ca: data.ca !== undefined ? Number(data.ca) : undefined,
        thal: data.thal ? thalMap[data.thal] : undefined
      };

      const predictionData = mode === 'simple' ? { ...defaults, ...base } : base;

      // Ensure all required numeric fields are present for backend schema
      const filled = {
        ...predictionData,
        fbs: predictionData.fbs ?? defaults.fbs,
        restecg: predictionData.restecg ?? defaults.restecg,
        slope: predictionData.slope ?? defaults.slope,
        ca: predictionData.ca ?? defaults.ca,
        thal: predictionData.thal ?? defaults.thal
      };

      // Call prediction API
      const response = await fetch('/api/prediction/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(filled)
      });

      const resultJson = await response.json().catch(() => ({}));

      if (response.ok) {
        const result = resultJson;
        toast.success('Prediction completed successfully!');
        const predictionObj = result.prediction || result;
        if (predictionObj && predictionObj._id) {
          navigate(`/result/${predictionObj._id}`, { state: { prediction: predictionObj } });
        } else {
          navigate('/prediction', { replace: true });
        }
      } else {
        const msg = resultJson?.message || 'Prediction failed';
        throw new Error(msg);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error('Failed to make prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a file first');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('medicalReport', uploadedFile);

      const response = await fetch('/api/prediction/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const resultJson = await response.json().catch(() => ({}));

      if (response.ok) {
        const result = resultJson;
        toast.success('Prediction completed successfully!');
        const predictionObj = result.prediction || result;
        if (predictionObj && predictionObj._id) {
          navigate(`/result/${predictionObj._id}`, { state: { prediction: predictionObj } });
        } else {
          navigate('/prediction', { replace: true });
        }
      } else {
        const msg = resultJson?.message || 'Upload prediction failed';
        throw new Error(msg);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Heart className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Heart Disease Prediction
          </h1>
          <p className="text-gray-600">
            Input your health data or upload a medical report to get an AI-powered prediction
          </p>
        </div>

        {/* Input Method Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Input Method</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setInputMethod('manual')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                inputMethod === 'manual'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Manual Input
            </button>
            {/* <button
              onClick={() => setInputMethod('upload')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                inputMethod === 'upload'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              Upload Report
            </button> */}
          </div>
        </div>

        {/* Manual Input Form */}
        {inputMethod === 'manual' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Health Information</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {mode === 'simple' ? 'Basic inputs (recommended)' : 'Advanced medical inputs'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Mode:</span>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="input"
                  >
                    <option value="simple">Simple</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(mode === 'simple' ? simpleFields : [...simpleFields, ...advancedOnlyFields]).map((field) => (
                  <div key={field.name} className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'select' ? (
                      <select
                        {...register(field.name, { required: field.required })}
                        className="input w-full"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        {...register(field.name, { 
                          required: field.required,
                          min: field.min,
                          max: field.max,
                          step: field.step
                        })}
                        className="input w-full"
                        placeholder={field.label}
                      />
                    )}
                    
                    {errors[field.name] && (
                      <p className="text-red-500 text-sm mt-1">
                        {field.label} is required
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="btn btn-secondary"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? 'Processing...' : 'Get Prediction'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* File Upload Form */}
        {inputMethod === 'upload' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upload Medical Report</h2>
              <p className="text-sm text-gray-600 mt-1">
                Supported formats: PDF, JPG, PNG. We'll extract health data automatically.
              </p>
            </div>
            <div className="p-6">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {!uploadedFile ? (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drag and drop your medical report here, or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="btn btn-primary cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                ) : (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-900 font-medium mb-2">{uploadedFile.name}</p>
                    <p className="text-gray-600 mb-4">
                      File uploaded successfully
                    </p>
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setExtractedData(null);
                      }}
                      className="btn btn-secondary"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove File
                    </button>
                  </div>
                )}
              </div>

              {/* Extracted Data Display */}
              {extractedData && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-3">
                    Extracted Health Data
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {Object.entries(extractedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-blue-700 font-medium">
                          {key.charAt(0).toUpperCase() + key.slice(1)}:
                        </span>
                        <span className="text-blue-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUploadSubmit}
                  disabled={!uploadedFile || isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? 'Processing...' : 'Get Prediction'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                Important Information
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                This prediction is based on AI analysis and should not replace professional medical advice. 
                Always consult with healthcare professionals for medical decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionForm;
