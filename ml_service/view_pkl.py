import pickle

with open("heart_disease_model.pkl", "rb") as f:
    model = pickle.load(f)

print(model)
