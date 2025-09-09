#!/usr/bin/env python3
"""
Heart Disease Prediction using Random Forest Classifier
This script loads a pre-trained model and makes predictions on new data.
"""

import sys
import json
import pickle
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

def _resolve_model_path(filename: str) -> str:
    """Resolve model file path, checking ml_service and server directories."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base_dir, filename),
        os.path.join(base_dir, '..', 'server', filename),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    # Default to ml_service path for saving newly trained models
    return os.path.join(base_dir, filename)


def load_model():
    """Load the pre-trained Random Forest model and scaler."""
    try:
        # Load the trained model
        with open(_resolve_model_path('heart_disease_model.pkl'), 'rb') as f:
            model = pickle.load(f)
        
        # Load the scaler
        with open(_resolve_model_path('heart_disease_scaler.pkl'), 'rb') as f:
            scaler = pickle.load(f)
        
        return model, scaler
    except FileNotFoundError:
        # If model files don't exist, train a new one
        return train_new_model()

def train_new_model():
    """Train a new Random Forest model if pre-trained model doesn't exist."""
    try:
        # Load the heart disease dataset
        # You can replace this with your own dataset
        from sklearn.datasets import load_breast_cancer
        from sklearn.model_selection import train_test_split
        
        # For demonstration, we'll use a synthetic dataset
        # In production, you should use your actual heart disease dataset
        np.random.seed(42)
        n_samples = 1000
        
        # Generate synthetic heart disease data
        age = np.random.randint(20, 80, n_samples)
        sex = np.random.randint(0, 2, n_samples)
        cp = np.random.randint(0, 4, n_samples)
        trestbps = np.random.randint(80, 200, n_samples)
        chol = np.random.randint(100, 400, n_samples)
        fbs = np.random.randint(0, 2, n_samples)
        restecg = np.random.randint(0, 3, n_samples)
        thalach = np.random.randint(60, 200, n_samples)
        exang = np.random.randint(0, 2, n_samples)
        oldpeak = np.random.uniform(0, 6, n_samples)
        slope = np.random.randint(0, 3, n_samples)
        ca = np.random.randint(0, 5, n_samples)
        thal = np.random.randint(0, 4, n_samples)
        
        # Create synthetic target (heart disease)
        # This is a simplified logic - in reality, you'd use actual medical data
        target = (
            (age > 60).astype(int) * 0.3 +
            (sex == 1).astype(int) * 0.2 +
            (cp > 1).astype(int) * 0.4 +
            (trestbps > 140).astype(int) * 0.3 +
            (chol > 250).astype(int) * 0.3 +
            (fbs == 1).astype(int) * 0.2 +
            (thalach < 120).astype(int) * 0.3 +
            (exang == 1).astype(int) * 0.4 +
            (oldpeak > 2).astype(int) * 0.3
        )
        target = (target > 1.5).astype(int)
        
        # Create feature matrix
        X = np.column_stack([
            age, sex, cp, trestbps, chol, fbs, restecg,
            thalach, exang, oldpeak, slope, ca, thal
        ])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, target, test_size=0.2, random_state=42, stratify=target
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train Random Forest
        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        rf_model.fit(X_train_scaled, y_train)
        
        # Save model and scaler next to this script
        model_path = _resolve_model_path('heart_disease_model.pkl')
        scaler_path = _resolve_model_path('heart_disease_scaler.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(rf_model, f)
        
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
        
        # Log to stderr to avoid breaking JSON output expected by the Node.js process
        sys.stderr.write(f"Model trained and saved. Test accuracy: {rf_model.score(X_test_scaled, y_test):.3f}\n")
        
        return rf_model, scaler
        
    except Exception as e:
        # Log errors to stderr
        sys.stderr.write(f"Error training model: {e}\n")
        # Return a simple fallback model
        return create_fallback_model()

def create_fallback_model():
    """Create a simple fallback model if training fails."""
    class FallbackModel:
        def predict_proba(self, X):
            # Simple rule-based prediction
            # This is just for demonstration - not medically accurate
            probas = []
            for features in X:
                risk_score = 0
                if features[0] > 60: risk_score += 0.2  # Age
                if features[1] == 1: risk_score += 0.1  # Sex
                if features[2] > 1: risk_score += 0.3   # Chest pain
                if features[3] > 140: risk_score += 0.2  # Blood pressure
                if features[4] > 250: risk_score += 0.2  # Cholesterol
                if features[7] < 120: risk_score += 0.2  # Heart rate
                
                prob = min(risk_score, 0.9)  # Cap at 90%
                probas.append([1 - prob, prob])
            return np.array(probas)
        
        def predict(self, X):
            probas = self.predict_proba(X)
            return (probas[:, 1] > 0.5).astype(int)
    
    class FallbackScaler:
        def transform(self, X):
            # Simple normalization
            return (X - np.mean(X, axis=0)) / (np.std(X, axis=0) + 1e-8)
    
    return FallbackModel(), FallbackScaler()

def preprocess_input(data):
    """Preprocess input data for prediction."""
    # Ensure all required features are present
    required_features = [
        'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg',
        'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'
    ]
    
    # Create feature vector
    features = []
    for feature in required_features:
        if feature in data:
            features.append(float(data[feature]))
        else:
            # Use default values for missing features
            defaults = {
                'age': 50, 'sex': 0, 'cp': 0, 'trestbps': 120,
                'chol': 200, 'fbs': 0, 'restecg': 0, 'thalach': 150,
                'exang': 0, 'oldpeak': 0, 'slope': 0, 'ca': 0, 'thal': 0
            }
            features.append(defaults[feature])
    
    return np.array(features).reshape(1, -1)

def predict_heart_disease(input_data):
    """Make heart disease prediction."""
    try:
        # Load model and scaler
        model, scaler = load_model()
        
        # Preprocess input
        X = preprocess_input(input_data)
        
        # Scale features
        X_scaled = scaler.transform(X)
        
        # Make prediction
        prediction = model.predict(X_scaled)[0]
        probability = model.predict_proba(X_scaled)[0][1]  # Probability of heart disease
        
        return {
            'prediction': int(prediction),
            'probability': float(probability),
            'confidence': 'high' if hasattr(model, 'estimators_') else 'low'
        }
        
    except Exception as e:
        # Log errors to stderr
        sys.stderr.write(f"Prediction error: {e}\n")
        # Return fallback prediction
        return {
            'prediction': 0,
            'probability': 0.1,
            'confidence': 'fallback',
            'error': str(e)
        }

def main():
    """Main function to handle command line input."""
    try:
        # Read input from command line arguments
        if len(sys.argv) < 2:
            # Log errors to stderr so stdout remains JSON-only
            sys.stderr.write("Error: No input data provided\n")
            sys.exit(1)
        
        # Parse input data
        input_json = sys.argv[1]
        input_data = json.loads(input_json)
        
        # Make prediction
        result = predict_heart_disease(input_data)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except json.JSONDecodeError:
        sys.stderr.write("Error: Invalid JSON input\n")
        sys.exit(1)
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
