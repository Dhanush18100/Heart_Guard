import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.calibration import CalibratedClassifierCV

# Load UCI Heart Disease Dataset
df = pd.read_csv("heart.csv")

# FEATURES and TARGET
X = df.drop("target", axis=1)
y = df["target"]

# TRAIN-TEST SPLIT
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# SCALE FEATURES
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# TRAIN RANDOM FOREST
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    random_state=42
)
rf.fit(X_train_scaled, y_train)

# CALIBRATE FOR REAL PROBABILITY OUTPUT
calibrated_rf = CalibratedClassifierCV(rf, method="isotonic", cv=5)
calibrated_rf.fit(X_train_scaled, y_train)

# SAVE MODEL + SCALER
with open("heart_disease_model.pkl", "wb") as f:
    pickle.dump(calibrated_rf, f)

with open("heart_disease_scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

print("Model trained and saved successfully!")
