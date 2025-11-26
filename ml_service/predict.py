#!/usr/bin/env python3
import sys
import json
import pickle
import os
import numpy as np

MODEL_FILE = "heart_disease_model.pkl"
SCALER_FILE = "heart_disease_scaler.pkl"


def resolve_path(filename):
    base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, filename)



# PREPROCESS INPUT
def preprocess_input(data):
    features = [
        float(data["age"]),
        float(data["sex"]),
        float(data["cp"]),
        float(data["trestbps"]),
        float(data["chol"]),
        float(data["fbs"]),
        float(data["restecg"]),
        float(data["thalach"]),
        float(data["exang"]),
        float(data["oldpeak"]),
        float(data["slope"]),
        float(data["ca"]),
        float(data["thal"])
    ]
    return np.array(features).reshape(1, -1)

def main():
    try:
        # load input
        input_json = sys.argv[1]
        data = json.loads(input_json)

        # load model
        with open(resolve_path(MODEL_FILE), "rb") as f:
            model = pickle.load(f)

        with open(resolve_path(SCALER_FILE), "rb") as f:
            scaler = pickle.load(f)

        # preprocess
        X = preprocess_input(data)
        X_scaled = scaler.transform(X)

        # predict
        prob = float(model.predict_proba(X_scaled)[0][1])
        prob = max(0.05, min(0.95, prob))   # cap probability safely
        pred = int(prob > 0.5)

        print(json.dumps({
            "prediction": pred,
            "probability": prob,
            "confidence": "high"
        }))

    except Exception as e:
        print(json.dumps({
            "prediction": 0,
            "probability": 0.1,
            "confidence": "fallback",
            "error": str(e)
        }))

if __name__ == "__main__":
    main()
