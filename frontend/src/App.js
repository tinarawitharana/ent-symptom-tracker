import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import config from './config';

// Patient Components
import Registration from './Registration';
import Login from './Login';
import ConditionSelect from './ConditionSelect';
import SymptomLog from './SymptomLog';

// Doctor Components
import DoctorLogin from './DoctorLogin';
import DoctorDashboard from './DoctorDashboard';
import PatientAnalytics from './PatientAnalytics';
import PatientLogs from './PatientLogs';
import AIAnalysis from './AIAnalysis';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState(null);
  const [userType, setUserType] = useState(null); // 'patient' or 'doctor'

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/status`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok && data.isLoggedIn) {
        setIsLoggedIn(true);
        if (data.patient_id) {
          setCurrentPatientId(data.patient_id);
          setUserType('patient');
        } else if (data.doctor_id) {
          setCurrentPatientId(data.doctor_id);
          setUserType('doctor');
        }
      } else {
        setIsLoggedIn(false);
        setCurrentPatientId(null);
        setUserType(null);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
      setCurrentPatientId(null);
      setUserType(null);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include'
      });
      if (response.ok) {
        setIsLoggedIn(false);
        setCurrentPatientId(null);
        setUserType(null);
        alert('Logged out successfully!');
      } else {
        alert('Logout failed.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Network error during logout.');
    }
  };
  

  // Landing page component
 
  const LandingPage = () => (
    <div className="homepage-container">
      <div className="homepage-content">
        <div className="homepage-header">
          <div className="medical-logo">
            <span className="logo-icon">🏥</span>
            <h1 className="homepage-title">
              MediTracker
            </h1>
          </div>
          <p className="homepage-subtitle">
            Healthcare Symptom Monitoring Platform
          </p>
        </div>
        
        <div className="portal-cards">
          <div className="portal-card patient-portal">
            <div className="portal-icon">
              <span>👤</span>
            </div>
            <div className="portal-content">
              <h3 className="portal-title">Patient Portal</h3>
              <p className="portal-description">
                Log In 
              </p>
     
              <Link 
                to="/login" 
                className="portal-button patient-button"
              >
                <span>Access Patient Portal</span>
                <span className="button-arrow">→</span>
              </Link>
            </div>
          </div>

          <div className="portal-card doctor-portal">
            <div className="portal-icon">
              <span>🩺</span>
            </div>
            <div className="portal-content">
              <h3 className="portal-title">Doctor Portal</h3>
              <p className="portal-description">
                Login to Monitor patients
              </p>
              
              <Link 
                to="/doctor/login" 
                className="portal-button doctor-button"
              >
                <span>Access Provider Portal</span>
                <span className="button-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  ); 

return (
  <Router>
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Patient Routes */}
      <Route path="/register" element={<Registration />} />
      <Route path="/login" element={<Login />} />
      <Route path="/condition-select" element={<ConditionSelect />} />
      <Route path="/symptom-log" element={<SymptomLog />} />

      {/* Doctor Routes */}
      <Route path="/doctor/login" element={<DoctorLogin />} />
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      <Route path="/doctor/patient/:patientId" element={<PatientAnalytics />} />
      <Route path="/doctor/patient/:patientId/logs" element={<PatientLogs />} />
      <Route path="/doctor/patient/:patientId/ai-analysis" element={<AIAnalysis />} />

      {/* Fallback Route */}
      <Route path="*" element={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <Link 
            to="/" 
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#1e40af',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px'
            }}
          >
            Go Home
          </Link>
        </div>
      } />
    </Routes>
  </Router>
);
}
export default App;