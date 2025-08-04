import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css'; // Import the CSS file
import config from './config';


function ConditionSelect() {
  const [hasRhinitis, setHasRhinitis] = useState(false);
  const [hasVertigo, setHasVertigo] = useState(false);
  const [hasTinnitus, setHasTinnitus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const selectedConditions = {
      has_rhinitis: hasRhinitis,
      has_vertigo: hasVertigo,
      has_tinnitus: hasTinnitus,
    };

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(selectedConditions),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication required. Redirecting to login.');
          navigate('/login');
          return;
        }
        const errorData = await response.json().catch(() => response.text());
        setError('Failed to save conditions. Please try again.');
        return;
      }

      const data = await response.json();
      console.log('Conditions saved:', data);
      navigate('/symptom-log');

    } catch (error) {
      console.error('Error saving conditions:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const conditions = [
    {
      id: 'rhinitis',
      name: 'Rhinitis',
      description: 'Nasal inflammation causing runny nose, congestion, sneezing',
      checked: hasRhinitis,
      setter: setHasRhinitis,
      icon: ''
    },
    {
      id: 'vertigo',
      name: 'Vertigo',
      description: 'Dizziness and balance issues',
      checked: hasVertigo,
      setter: setHasVertigo,
      icon: ''
    },
    {
      id: 'tinnitus',
      name: 'Tinnitus',
      description: 'Ringing or buzzing sounds in the ears',
      checked: hasTinnitus,
      setter: setHasTinnitus,
      icon: ''
    }
  ];

  const selectedCount = conditions.filter(c => c.checked).length;

  return (
    <div className="container">
      <div className="nav">
        <div className="nav-title">MediTracker</div>
        <button 
          className="nav-button"
          onClick={() => navigate('/login')}
        >
          Logout
        </button>
      </div>
      
      <div className="card">
        <h1>Select Your Conditions</h1>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#718096' }}>
          Choose the conditions you'd like to track
        </p>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="checkbox-group">
            {conditions.map((condition) => (
              <div key={condition.id} className="checkbox-item">
                <input
                  type="checkbox"
                  id={condition.id}
                  checked={condition.checked}
                  onChange={(e) => condition.setter(e.target.checked)}
                />
                <label htmlFor={condition.id} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{condition.icon}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>
                        {condition.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#718096', marginTop: '2px' }}>
                        {condition.description}
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            margin: '20px 0',
            padding: '15px',
            background: '#f7fafc',
            borderRadius: '8px',
            color: '#4a5568'
          }}>
            {selectedCount === 0 ? (
              <span>Please select at least one condition to continue</span>
            ) : (
              <span>
                {selectedCount} condition{selectedCount !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={loading || selectedCount === 0}
            style={{
              opacity: selectedCount === 0 ? 0.5 : 1,
              cursor: selectedCount === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving...' : 'Continue to Symptom Tracking'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ConditionSelect;