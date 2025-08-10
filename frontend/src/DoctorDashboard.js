import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import config from './config';

function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/doctor/dashboard`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/doctor/login');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setPatients(data.patients);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientClick = (patientId) => {
    navigate(`/doctor/patient/${patientId}`);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/doctor/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Filter patients based on search and condition
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCondition = selectedCondition === 'all' || 
                           patient.conditions[selectedCondition] === true;
    
    return matchesSearch && matchesCondition;
  });

  const getConditionIcons = (conditions) => {
    const icons = [];
    if (conditions.rhinitis) icons.push('👃');
    if (conditions.vertigo) icons.push('💫');
    if (conditions.tinnitus) icons.push('🔊');
    return icons.join(' ');
  };

  const getActivityStatus = (lastLogDate) => {
    if (!lastLogDate) return { status: 'never', color: '#e53e3e', text: 'Never logged' };
    
    const daysSince = Math.floor((new Date() - new Date(lastLogDate)) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) return { status: 'today', color: '#38a169', text: 'Today' };
    if (daysSince === 1) return { status: 'recent', color: '#38a169', text: 'Yesterday' };
    if (daysSince <= 7) return { status: 'week', color: '#d69e2e', text: `${daysSince} days ago` };
    if (daysSince <= 30) return { status: 'month', color: '#ed8936', text: `${daysSince} days ago` };
    return { status: 'old', color: '#e53e3e', text: `${daysSince} days ago` };
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="nav">
        <div className="nav-title">MediTracker Doctor Dashboard</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          
          <button className="nav-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card">
        <div className="dashboard-header">
          <h1>Patient Overview</h1>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-number">{patients.length}</div>
              <div className="stat-label">Total Patients</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {patients.filter(p => getActivityStatus(p.last_log_date).status === 'today').length}
              </div>
              <div className="stat-label">Active Today</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {patients.filter(p => p.total_logs > 0).length}
              </div>
              <div className="stat-label">With Data</div>
            </div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="dashboard-filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-container">
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Conditions</option>
              <option value="rhinitis">Rhinitis</option>
              <option value="vertigo">Vertigo</option>
              <option value="tinnitus">Tinnitus</option>
            </select>
          </div>
        </div>

        <div className="patients-grid">
          {filteredPatients.length === 0 ? (
            <div className="no-patients">
              <p>No patients found matching your criteria</p>
              <button onClick={() => navigate('/doctor/add-patient')}>
                Add Your First Patient
              </button>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const activity = getActivityStatus(patient.last_log_date);
              return (
                <div
                  key={patient.patient_id}
                  className="patient-card"
                  onClick={() => handlePatientClick(patient.patient_id)}
                >
                  <div className="patient-header">
                    <div className="patient-name">
                      {patient.name || patient.username}
                    </div>
                    <div className="patient-conditions">
                      {getConditionIcons(patient.conditions)}
                    </div>
                  </div>
                  
                  <div className="patient-details">
                    <div className="detail-row">
                      <span className="detail-label">Username:</span>
                      <span className="detail-value">{patient.username}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Total Logs:</span>
                      <span className="detail-value">{patient.total_logs}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Last Activity:</span>
                      <span 
                        className="detail-value activity-status"
                        style={{ color: activity.color }}
                      >
                        {activity.text}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Assigned:</span>
                      <span className="detail-value">
                        {new Date(patient.assigned_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="patient-actions">
                    <button 
                      className="action-button primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctor/patient/${patient.patient_id}/logs`);
                      }}
                    >
                      📋 View Logs
                    </button>
                    <button 
                      className="action-button secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctor/patient/${patient.patient_id}`);
                      }}
                    >
                      📊 Analytics
                    </button>
                    <button 
                      className="action-button secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctor/patient/${patient.patient_id}/ai-analysis`);
                      }}
                    >
                      🤖 AI Analysis
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;