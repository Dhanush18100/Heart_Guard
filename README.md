# Heart_Guard

![License](https://img.shields.io/badge/license-MIT-green)

## 📝 Description

Heart_Guard is a comprehensive health monitoring and diagnostic platform built with Express.js, designed to provide robust cardiovascular data management. This versatile application features a powerful RESTful API, a secure database for persistent storage, and a user-friendly web interface for seamless monitoring. In addition to its web capabilities, Heart_Guard includes a dedicated CLI for developer-centric operations and automated tasks. With an integrated testing suite to ensure system reliability and data integrity, Heart_Guard offers a production-ready solution for tracking and protecting critical health metrics across multiple interfaces.

## ✨ Features

- 🌐 Api
- 🗄️ Database
- 🧪 Testing
- 💻 Cli
- 🕸️ Web


## 🛠️ Tech Stack

- 🚀 Express.js


## 📦 Key Dependencies

```
axios: ^1.5.0
bcryptjs: ^2.4.3
cors: ^2.8.5
dotenv: ^16.6.1
express: ^4.18.2
express-rate-limit: ^6.10.0
express-session: ^1.18.2
express-validator: ^7.0.1
helmet: ^7.0.0
jsonwebtoken: ^9.0.2
mongoose: ^7.5.0
multer: ^1.4.5-lts.1
nodemailer: ^7.0.10
passport: ^0.7.0
passport-google-oauth20: ^2.0.0
```

## 🚀 Run Commands

- **benchmark**: `npm run benchmark`
- **test**: `npm run test`
- **clean**: `npm run clean`
- **build**: `npm run build`
- **fix**: `npm run fix`
- **check-package-bundle**: `npm run check-package-bundle`
- **lint**: `npm run lint`
- **prebuild**: `npm run prebuild`
- **prepack**: `npm run prepack`
- **posttest**: `npm run posttest`
- **postbuild**: `npm run postbuild`
- **test**: `make test`


## 📁 Project Structure

```
.
├── client
│   ├── package.json
│   ├── postcss.config.js
│   ├── public
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src
│   │   ├── App.js
│   │   ├── assets
│   │   │   ├── arrow_icon.svg
│   │   │   ├── assets.js
│   │   │   ├── bg_img.png
│   │   │   ├── emailTemplates.js
│   │   │   ├── favicon.svg
│   │   │   ├── hand_wave.png
│   │   │   ├── header_img.png
│   │   │   ├── lock_icon.svg
│   │   │   ├── logo.svg
│   │   │   ├── mail_icon.svg
│   │   │   └── person_icon.svg
│   │   ├── components
│   │   │   └── layout
│   │   │       └── Navbar.js
│   │   ├── contexts
│   │   │   └── AuthContext.js
│   │   ├── index.css
│   │   ├── index.js
│   │   └── pages
│   │       ├── Dashboard.js
│   │       ├── History.js
│   │       ├── Home.js
│   │       ├── Login.js
│   │       ├── NearbyDoctors.js
│   │       ├── PredictionForm.js
│   │       ├── PredictionResult.js
│   │       ├── Profile.js
│   │       ├── Register.js
│   │       └── ResetPassword.js
│   └── tailwind.config.js
├── ml_service
│   ├── heart.csv
│   ├── heart_disease_model.pkl
│   ├── heart_disease_scaler.pkl
│   ├── predict.py
│   ├── requirements.txt
│   ├── train_model.py
│   └── view_pkl.py
├── package.json
└── server
    ├── config
    │   ├── emailTemplates.js
    │   └── nodemailer.js
    ├── heart_disease_model.pkl
    ├── heart_disease_scaler.pkl
    ├── index.js
    ├── middleware
    │   └── auth.js
    ├── models
    │   ├── Prediction.js
    │   └── User.js
    └── routes
        ├── auth.js
        ├── dashboard.js
        ├── prediction.js
        └── user.js
```

## 👥 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/Dhanush18100/Heart_Guard.git`
3. **Create** a new branch: `git checkout -b feature/your-feature`
4. **Commit** your changes: `git commit -am 'Add some feature'`
5. **Push** to your branch: `git push origin feature/your-feature`
6. **Open** a pull request

Please ensure your code follows the project's style guidelines and includes tests where applicable.

## 📜 License

This project is licensed under the MIT License.

---

