import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css'; // Import the CSS file
import config from './config';


function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        navigate('/symptom-log');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('There was an error during login:', error);
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
          onClick={() => navigate('/register')}
        >
          Register
        </button>
      </div>
      
      <div className="card">
        <h1>Welcome Back</h1>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#718096' }}>
          Sign in to continue tracking your symptoms
        </p>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
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
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>
          Don't have an account?{' '}
          <span 
            style={{ color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/register')}
          >
            Create one here
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;