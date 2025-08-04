import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import config from './config';


function DoctorLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const response = await fetch(`${config.API_BASE_URL}/api/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Successfully logged in
        navigate('/doctor/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Quick login function for demo purposes
  const quickLogin = () => {
    setFormData({
      username: 'doctor',
      password: 'admin123'
    });
  };

  return (
    <div className="container">
      <div className="nav">
        <div className="nav-title">MediTracker - Doctor Portal</div>
        <button 
          className="nav-button"
          onClick={() => navigate('/')}
        >
          Patient Portal
        </button>
      </div>
      
      <div className="card">
        <div className="doctor-login-header">
          <h1>🩺 Doctor Login</h1>
          <p style={{ textAlign: 'center', marginBottom: '30px' }}>
            Access your patient dashboard and analytics
          </p>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="doctor-login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
          
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        

        {/* System Info */}
        <div className="system-info">
          <h4>ℹ️ MediTracker</h4>
          <ul>
          
            <li>View patient symptom logs and analytics</li>
            <li>AI-powered symptom analysis and predictions</li>
         
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DoctorLogin;