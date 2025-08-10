import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css'; // Import the CSS file
import config from './config';


function Registration() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          username, 
          password, 
          first_name: firstName, 
          last_name: lastName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Registration successful:', data);
        navigate('/condition-select');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('There was an error during registration:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="nav">
        <div className="nav-title">MediTracker</div>
        <button 
          className="nav-button" 
          onClick={() => navigate('/login')}
        >
          Login
        </button>
      </div>
      
      <div className="card">
        <h1>Create Account</h1>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#718096' }}>
          Join to start tracking your symptoms
        </p>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>
          Already have an account?{' '}
          <span 
            style={{ color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/login')}
          >
            Sign in here
          </span>
        </p>
      </div>
    </div>
  );
}

export default Registration;