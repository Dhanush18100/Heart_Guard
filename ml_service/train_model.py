import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.svm import SVC

# -------------------------------------------------
# 1. Load Dataset
# -------------------------------------------------
df = pd.read_csv("heart.csv")

# FEATURES & TARGET
X = df.drop("target", axis=1)
y = df["target"]

# -------------------------------------------------
# 2. Train-Test Split
# -------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# -------------------------------------------------
# 3. Feature Scaling
# -------------------------------------------------
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# -------------------------------------------------
# 4. Improved Random Forest Model (High Accuracy)
# -------------------------------------------------
rf = RandomForestClassifier(
    n_estimators=400,        # more trees = better learning
    max_depth=None,          # allow deeper trees
    min_samples_split=2,
    min_samples_leaf=1,
    bootstrap=True,
    class_weight="balanced", # handles imbalance
    random_state=42
)
rf.fit(X_train_scaled, y_train)

# -------------------------------------------------
# 5. Calibrate the model for real probabilities
# -------------------------------------------------
calibrated_rf = CalibratedClassifierCV(rf, method="isotonic", cv=5)
calibrated_rf.fit(X_train_scaled, y_train)
# -------------------------------------------------
# 6. Save Model & Scaler
# -------------------------------------------------
with open("heart_disease_model.pkl", "wb") as f:
    pickle.dump(calibrated_rf, f)

with open("heart_disease_scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

print("Model trained and saved successfully!")

# -------------------------------------------------
# 7. Model Predictions
# -------------------------------------------------
y_pred = calibrated_rf.predict(X_test_scaled)

# -------------------------------------------------
# 8. Evaluation Metrics
# -------------------------------------------------
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("\n----- MODEL PERFORMANCE -----")
print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")

# -------------------------------------------------
# 9. Bar Chart of Metrics
# -------------------------------------------------
metrics = [accuracy, precision, recall, f1]
labels = ["Accuracy", "Precision", "Recall", "F1-score"]

plt.figure(figsize=(8, 5))
plt.bar(labels, metrics)
plt.ylabel("Score")
plt.title("Performance Metrics of Heart Disease Prediction Model")
plt.show()

# -------------------------------------------------
# 10. Pie Chart (Prediction Distribution)
# -------------------------------------------------
unique, counts = np.unique(y_pred, return_counts=True)
plt.figure(figsize=(5, 5))
plt.pie(counts, labels=[f"Class {u}" for u in unique], autopct='%1.1f%%')
plt.title("Predicted Class Distribution")
plt.show()

# -------------------------------------------------
# 11. Confusion Matrix Heatmap
# -------------------------------------------------
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 4))
sns.heatmap(cm, annot=True, fmt='d', cmap="Blues")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix")
plt.show()
