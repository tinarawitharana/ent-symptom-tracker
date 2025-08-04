import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css'; // Import the CSS file
import config from './config';


function SymptomLog() {
  const [conditions, setConditions] = useState({
    has_rhinitis: false,
    has_vertigo: false,
    has_tinnitus: false,
  });
  const [loadingConditions, setLoadingConditions] = useState(true);
  const [errorFetchingConditions, setErrorFetchingConditions] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Fetch conditions
  useEffect(() => {
    const fetchConditions = async () => {
      setLoadingConditions(true);
      setErrorFetchingConditions(null);
      try {
        const response = await fetch(`${config.API_BASE_URL}/api/status`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          setErrorFetchingConditions('Failed to load conditions');
          return;
        }

        const data = await response.json();
        setConditions(data);
      } catch (error) {
        setErrorFetchingConditions('Error connecting to server');
      } finally {
        setLoadingConditions(false);
      }
    };

    fetchConditions();
  }, [navigate]);

  // State for symptoms - all integers
  const [rhinitisRunnyNose, setRhinitisRunnyNose] = useState(3);
  const [rhinitisCongestion, setRhinitisCongestion] = useState(3);
  const [rhinitisSneezing, setRhinitisSneezing] = useState(3);
  const [rhinitisItchiness, setRhinitisItchiness] = useState(3);
  const [rhinitisLossSmell, setRhinitisLossSmell] = useState(3);

  const [vertigoSeverity, setVertigoSeverity] = useState(3);
  const [vertigoFrequency, setVertigoFrequency] = useState(null);
  const [vertigoType, setVertigoType] = useState(null);
  const [vertigoAssociated, setVertigoAssociated] = useState(null);

  const [tinnitusLoudness, setTinnitusLoudness] = useState(3);
  const [tinnitusType, setTinnitusType] = useState(null);
  const [tinnitusContinuity, setTinnitusContinuity] = useState(null);
  const [tinnitusImpact, setTinnitusImpact] = useState(3);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccess(''); // Clear previous success message
    
    const symptoms = {
      rhinitis_runny_nose: rhinitisRunnyNose,
      rhinitis_congestion: rhinitisCongestion,
      rhinitis_sneezing: rhinitisSneezing,
      rhinitis_itchiness: rhinitisItchiness,
      rhinitis_loss_smell: rhinitisLossSmell,
      vertigo_severity: vertigoSeverity,
      vertigo_frequency: vertigoFrequency,
      vertigo_type: vertigoType,
      vertigo_associated: vertigoAssociated,
      tinnitus_loudness: tinnitusLoudness,
      tinnitus_type: tinnitusType,
      tinnitus_continuity: tinnitusContinuity,
      tinnitus_impact: tinnitusImpact,
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(symptoms),
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to submit symptoms');
      }

      setSuccess('Symptoms logged successfully! 🎉');
      
      // Scroll to bottom to show success message
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Error logging symptoms:', error);
      setSuccess('Error logging symptoms. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

// Helper render function for drag sliders with detailed 1-5 labels
const renderSlider = (question, state, setState, labels, scaleMin = 1, scaleMax = 5) => {
  const getSliderLabel = (value) => {
    const index = value - scaleMin;
    return labels[index] || value.toString();
  };

  return (
    <div className="slider-group">
      <div className="slider-question">{question}</div>
      <div className="slider-container">
        <div className="slider-labels-top">
          <span>{labels[0]}</span>
          <span>{labels[2]}</span>
          <span>{labels[4]}</span>
        </div>
        <div className="slider-wrapper">
          <input
            type="range"
            min={scaleMin}
            max={scaleMax}
            value={state}
            onChange={(e) => setState(parseInt(e.target.value))}
            className="slider"
            id={`slider_${question.toLowerCase().replace(/ /g, '_')}`}
          />
          <div className="slider-value">
            {state} - {getSliderLabel(state)}
          </div>
        </div>
        <div className="slider-numbers">
          {Array.from({ length: (scaleMax - scaleMin + 1) }).map((_, index) => {
            const value = scaleMin + index;
            return (
              <span 
                key={value} 
                className={state === value ? 'active' : ''}
                title={getSliderLabel(value)}
              >
                {value}
              </span>
            );
          })}
        </div>
        
        </div>
      </div>
    
  );
};

  // Helper render function for dropdown selections
  const renderDropdown = (question, state, setState, options) => (
    <div className="dropdown-group">
      <label>{question}</label>
      <select 
        value={state || ''} 
        onChange={(e) => setState(e.target.value ? parseInt(e.target.value) : null)}
      >
        <option value="">Select an option</option>
        {options.map((option, index) => (
          <option key={index} value={index + 1}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  if (loadingConditions) {
    return (
      <div className="container">
        <div className="loading">Loading your conditions...</div>
      </div>
    );
  }

  if (errorFetchingConditions) {
    return (
      <div className="container">
        <div className="error">{errorFetchingConditions}</div>
      </div>
    );
  }

  const hasAnyCondition = conditions.has_rhinitis || conditions.has_vertigo || conditions.has_tinnitus;

  return (
    <div className="container">
      <div className="nav">
        <div className="nav-title">MediTracker</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="nav-button"
            onClick={() => navigate('/condition-select')}
          >
            Edit Conditions
          </button>
          <button 
            className="nav-button"
            onClick={() => navigate('/login')}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="card">
        <h1>Today's Symptoms</h1>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#718096' }}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        
        {!hasAnyCondition ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#718096', marginBottom: '20px' }}>
              You haven't selected any conditions to track yet.
            </p>
            <button 
              onClick={() => navigate('/condition-select')}
              style={{ width: 'auto', padding: '10px 20px' }}
            >
              Select Conditions
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {conditions.has_rhinitis && (
              <div>
                <h3> Rhinitis Symptoms</h3>
                {renderSlider("Runny Nose", rhinitisRunnyNose, setRhinitisRunnyNose, [
                  "Not at all",
                  "Slightly runny", 
                  "Moderately runny",
                  "Quite runny",
                  "Very runny"
                ])}
                {renderSlider("Nasal Congestion", rhinitisCongestion, setRhinitisCongestion, [
                  "No congestion",
                  "Slightly blocked",
                  "Moderately congested", 
                  "Quite congested",
                  "Completely blocked"
                ])}
                {renderSlider("Sneezing", rhinitisSneezing, setRhinitisSneezing, [
                  "No sneezing",
                  "Occasional sneezing",
                  "Moderate sneezing",
                  "Frequent sneezing", 
                  "Constant sneezing"
                ])}
                {renderSlider("Itchiness", rhinitisItchiness, setRhinitisItchiness, [
                  "No itching",
                  "Slightly itchy",
                  "Moderately itchy",
                  "Quite itchy",
                  "Extremely itchy"
                ])}
                {renderSlider("Loss of Smell", rhinitisLossSmell, setRhinitisLossSmell, [
                  "Normal smell",
                  "Slightly reduced",
                  "Moderately reduced",
                  "Severely reduced", 
                  "Complete loss"
                ])}
              </div>
            )}

            {conditions.has_vertigo && (
              <div>
                <h3> Vertigo Symptoms</h3>
                {renderSlider("Severity of Dizziness", vertigoSeverity, setVertigoSeverity, [
                  "No dizziness",
                  "Mild dizziness",
                  "Moderate dizziness",
                  "Severe dizziness",
                  "Extreme dizziness"
                ])}
                {renderDropdown("Frequency of Episodes", vertigoFrequency, setVertigoFrequency, [
                  "Once a day",
                  "Multiple times a day", 
                  "Few times a week",
                  "Once a week",
                  "Few times a month"
                ])}
                {renderDropdown("Type of Dizziness", vertigoType, setVertigoType, [
                  "Spinning",
                  "Lightheaded", 
                  "Unsteady",
                  "Floating sensation",
                  "None of the above"
                ])}
                {renderDropdown("Associated Symptoms", vertigoAssociated, setVertigoAssociated, [
                  "None",
                  "Nausea", 
                  "Vomiting",
                  "Headache",
                  "Hearing changes",
                  "None of the above"
                ])}
              </div>
            )}

            {conditions.has_tinnitus && (
              <div>
                <h3> Tinnitus Symptoms</h3>
                {renderSlider("Loudness of Tinnitus", tinnitusLoudness, setTinnitusLoudness, [
                  "No sound",
                  "Very faint",
                  "Moderate volume", 
                  "Quite loud",
                  "Extremely loud"
                ])}
                {renderDropdown("Type of Sound", tinnitusType, setTinnitusType, [
                  "Ringing",
                  "Buzzing", 
                  "Hissing",
                  "Clicking",
                  "Pulsating",
                  "None of the above"
                ])}
                {renderDropdown("Continuity", tinnitusContinuity, setTinnitusContinuity, [
                  "Constant",
                  "Intermittent",
                  "None"
                ])}
                {renderSlider("Impact on Daily Life", tinnitusImpact, setTinnitusImpact, [
                  "No impact",
                  "Slightly bothersome",
                  "Moderately disruptive",
                  "Quite disruptive", 
                  "Severely impacts life"
                ])}
              </div>
            )}

            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving Symptoms...' : 'Log Today\'s Symptoms'}
            </button>
            
            {/* Success message appears here at the bottom */}
            {success && (
              <div className={success.includes('Error') ? 'error' : 'success'} style={{ marginTop: '20px' }}>
                {success}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default SymptomLog;