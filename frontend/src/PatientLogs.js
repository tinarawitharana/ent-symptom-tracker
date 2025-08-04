import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles.css';
import config from './config';


function PatientLogs() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchPatientLogs();
  }, [patientId]);

  const fetchPatientLogs = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/status`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/doctor/login');
          return;
        }
        throw new Error('Failed to fetch patient logs');
      }

      const data = await response.json();
      setPatient(data.patient);
      setLogs(data.logs);
    } catch (error) {
      setError('Failed to load patient logs');
      console.error('Logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (value) => {
    if (!value) return '#e2e8f0';
    if (value <= 2) return '#48bb78';
    if (value <= 3) return '#ed8936';
    return '#e53e3e';
  };

  const getSeverityLabel = (value) => {
    if (!value) return 'N/A';
    if (value === 1) return 'Very Mild';
    if (value === 2) return 'Mild';
    if (value === 3) return 'Moderate';
    if (value === 4) return 'Severe';
    if (value === 5) return 'Very Severe';
    return value.toString();
  };

  const getDropdownValue = (value, options) => {
    if (!value || !options[value - 1]) return 'N/A';
    return options[value - 1];
  };

  const sortedLogs = [...logs].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.log_timestamp) - new Date(a.log_timestamp);
    } else {
      return new Date(a.log_timestamp) - new Date(b.log_timestamp);
    }
  });

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading patient logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button onClick={() => navigate('/doctor/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="nav">
        <div className="nav-title">Patient Logs</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="nav-button" onClick={() => navigate(`/doctor/patient/${patientId}`)}>
            Analytics
          </button>
          <button className="nav-button" onClick={() => navigate(`/doctor/patient/${patientId}/ai-analysis`)}>
            AI Analysis
          </button>
          <button className="nav-button" onClick={() => navigate('/doctor/dashboard')}>
            Dashboard
          </button>
        </div>
      </div>

      <div className="card">
        <div className="patient-header-section">
          <h1>📋 {patient?.name || patient?.username} - Symptom Logs</h1>
          <div className="patient-meta">
            <span>Patient ID: {patient?.id}</span>
            <span>Total Logs: {logs.length}</span>
            <span>
              Conditions: {Object.entries(patient?.conditions || {})
                .filter(([_, active]) => active)
                .map(([condition, _]) => condition.charAt(0).toUpperCase() + condition.slice(1))
                .join(', ') || 'None'}
            </span>
          </div>
        </div>

        <div className="logs-controls">
          <div className="sort-controls">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="no-logs">
            <h3>📊 No Symptom Logs Yet</h3>
            <p>This patient hasn't logged any symptoms yet.</p>
          </div>
        ) : (
          <div className="logs-container">
            <div className="logs-grid">
              {sortedLogs.map((log) => (
                <div
                  key={log.log_id}
                  className={`log-card ${selectedLog?.log_id === log.log_id ? 'selected' : ''}`}
                  onClick={() => setSelectedLog(selectedLog?.log_id === log.log_id ? null : log)}
                >
                  <div className="log-header">
                    <div className="log-date">
                      {formatDate(log.log_timestamp)}
                    </div>
                    <div className="log-id">
                      Log #{log.log_id}
                    </div>
                  </div>

                  <div className="log-summary">
                    {patient?.conditions?.rhinitis && (
                      <div className="condition-summary">
                        <span className="condition-icon">🌿</span>
                        <span className="condition-name">Rhinitis</span>
                        <div className="severity-indicators">
                          {[
                            { label: 'Runny', value: log.rhinitis_runny_nose },
                            { label: 'Congestion', value: log.rhinitis_congestion },
                            { label: 'Sneezing', value: log.rhinitis_sneezing },
                            { label: 'Itchy', value: log.rhinitis_itchiness },
                            { label: 'Smell', value: log.rhinitis_loss_smell }
                          ].map((item, index) => (
                            <div
                              key={index}
                              className="severity-dot"
                              style={{ backgroundColor: getSeverityColor(item.value) }}
                              title={`${item.label}: ${getSeverityLabel(item.value)}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {patient?.conditions?.vertigo && (
                      <div className="condition-summary">
                        <span className="condition-icon">💫</span>
                        <span className="condition-name">Vertigo</span>
                        <div className="severity-indicators">
                          <div
                            className="severity-dot"
                            style={{ backgroundColor: getSeverityColor(log.vertigo_severity) }}
                            title={`Severity: ${getSeverityLabel(log.vertigo_severity)}`}
                          />
                        </div>
                      </div>
                    )}

                    {patient?.conditions?.tinnitus && (
                      <div className="condition-summary">
                        <span className="condition-icon">🔊</span>
                        <span className="condition-name">Tinnitus</span>
                        <div className="severity-indicators">
                          {[
                            { label: 'Loudness', value: log.tinnitus_loudness },
                            { label: 'Impact', value: log.tinnitus_impact }
                          ].map((item, index) => (
                            <div
                              key={index}
                              className="severity-dot"
                              style={{ backgroundColor: getSeverityColor(item.value) }}
                              title={`${item.label}: ${getSeverityLabel(item.value)}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedLog?.log_id === log.log_id && (
                    <div className="log-details">
                      {patient?.conditions?.rhinitis && (
                        <div className="detailed-section">
                          <h4>🌿 Rhinitis Details</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span>Runny Nose:</span>
                              <span style={{ color: getSeverityColor(log.rhinitis_runny_nose) }}>
                                {getSeverityLabel(log.rhinitis_runny_nose)}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span>Congestion:</span>
                              <span style={{ color: getSeverityColor(log.rhinitis_congestion) }}>
                                {getSeverityLabel(log.rhinitis_congestion)}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span>Sneezing:</span>
                              <span style={{ color: getSeverityColor(log.rhinitis_sneezing) }}>
                                {getSeverityLabel(log.rhinitis_sneezing)}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span>Itchiness:</span>
                              <span style={{ color: getSeverityColor(log.rhinitis_itchiness) }}>
                                {getSeverityLabel(log.rhinitis_itchiness)}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span>Loss of Smell:</span>
                              <span style={{ color: getSeverityColor(log.rhinitis_loss_smell) }}>
                                {getSeverityLabel(log.rhinitis_loss_smell)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {patient?.conditions?.vertigo && (
                        <div className="detailed-section">
                          <h4>💫 Vertigo Details</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span>Severity:</span>
                              <span style={{ color: getSeverityColor(log.vertigo_severity) }}>
                                {getSeverityLabel(log.vertigo_severity)}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span>Frequency:</span>
                              <span>{getDropdownValue(log.vertigo_frequency, [
                                "Once a day", "Multiple times a day", "Few times a week",
                                "Once a week", "Few times a month"
                              ])}</span>
                            </div>
                            <div className="detail-item">
                              <span>Type:</span>
                              <span>{getDropdownValue(log.vertigo_type, [
                                "Spinning", "Lightheaded", "Unsteady",
                                "Floating sensation", "Other"
                              ])}</span>
                            </div>
                            <div className="detail-item">
                              <span>Associated:</span>
                              <span>{getDropdownValue(log.vertigo_associated, [
                                "None", "Nausea", "Vomiting", "Headache", "Hearing changes"
                              ])}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {patient?.conditions?.tinnitus && (
                        <div className="detailed-section">
                          <h4>🔊 Tinnitus Details</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span>Loudness:</span>
                              <span style={{ color: getSeverityColor(log.tinnitus_loudness) }}>
                                {getSeverityLabel(log.tinnitus_loudness)}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span>Type:</span>
                              <span>{getDropdownValue(log.tinnitus_type, [
                                "Ringing", "Buzzing", "Hissing", "Clicking", "Pulsating", "Other"
                              ])}</span>
                            </div>
                            <div className="detail-item">
                              <span>Continuity:</span>
                              <span>{getDropdownValue(log.tinnitus_continuity, [
                                "Constant", "Intermittent"
                              ])}</span>
                            </div>
                            <div className="detail-item">
                              <span>Impact:</span>
                              <span style={{ color: getSeverityColor(log.tinnitus_impact) }}>
                                {getSeverityLabel(log.tinnitus_impact)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientLogs;