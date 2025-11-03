import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PredictionForm from './pages/PredictionForm';
import PredictionResult from './pages/PredictionResult';
import History from './pages/History';
import Profile from './pages/Profile';
import NearbyDoctors from './pages/NearbyDoctors';
import './index.css';
import ResetPassword from './pages/ResetPassword';


// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = ['user', 'admin', 'doctor'] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Admin Route Component
// const AdminRoute = ({ children }) => (
//   <ProtectedRoute allowedRoles={['admin']}>
//     {children}
//   </ProtectedRoute>
// );

// Doctor Route Component
// const DoctorRoute = ({ children }) => (
//   <ProtectedRoute allowedRoles={['admin', 'doctor']}>
//     {children}
//   </ProtectedRoute>
// );

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true }}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="pt-16">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path='/reset-password' element={<ResetPassword/>}/>

              {/* Protected User Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/prediction" element={
                <ProtectedRoute>
                  <PredictionForm />
                </ProtectedRoute>
              } />
              <Route path="/result/:id" element={
                <ProtectedRoute>
                  <PredictionResult />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              {/* <Route path="/nearby-doctors" element={
                <ProtectedRoute>
                  <NearbyDoctors />
                </ProtectedRoute>
              } /> */}

             

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
