import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import './styles.css';
import config from './config';

function PatientAnalytics() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChart, setSelectedChart] = useState('overall');

  useEffect(() => {
    fetchPatientAnalytics();
  }, [patientId]);

  const fetchPatientAnalytics = async () => {
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
        throw new Error('Failed to fetch patient data');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      setError('Failed to load patient analytics');
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (chartData, field) => {
    if (!chartData || chartData.length < 2) return 'stable';
    
    const validData = chartData.filter(d => d[field] !== null && d[field] !== undefined);
    if (validData.length < 2) return 'stable';
    
    const recent = validData.slice(-3).reduce((sum, d) => sum + d[field], 0) / 3;
    const earlier = validData.slice(0, 3).reduce((sum, d) => sum + d[field], 0) / 3;
    
    const change = ((recent - earlier) / earlier) * 100;
    
    if (change > 10) return 'worsening';
    if (change < -10) return 'improving';
    return 'stable';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📉';
      case 'worsening': return '📈';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return '#38a169';
      case 'worsening': return '#e53e3e';
      default: return '#718096';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getLatestValues = () => {
    if (!data?.chart_data || data.chart_data.length === 0) return {};
    
    const latest = data.chart_data[data.chart_data.length - 1];
    return {
      rhinitis: latest.rhinitis_avg,
      vertigo: latest.vertigo_severity,
      tinnitus: latest.tinnitus_avg,
      overall: latest.overall_severity
    };
  };

  const getAverageValues = () => {
    if (!data?.chart_data || data.chart_data.length === 0) return {};
    
    const validData = data.chart_data.filter(d => d.overall_severity > 0);
    const count = validData.length;
    
    if (count === 0) return {};
    
    return {
      rhinitis: validData.reduce((sum, d) => sum + (d.rhinitis_avg || 0), 0) / count,
      vertigo: validData.reduce((sum, d) => sum + (d.vertigo_severity || 0), 0) / count,
      tinnitus: validData.reduce((sum, d) => sum + (d.tinnitus_avg || 0), 0) / count,
      overall: validData.reduce((sum, d) => sum + d.overall_severity, 0) / count
    };
  };

  const prepareChartData = () => {
    if (!data?.chart_data) return [];
    
    return data.chart_data.map(entry => ({
      ...entry,
      date: formatDate(entry.date),
      rhinitis_avg: entry.rhinitis_avg || 0,
      vertigo_severity: entry.vertigo_severity || 0,
      tinnitus_avg: entry.tinnitus_avg || 0,
      overall_severity: entry.overall_severity || 0
    }));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Date: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value?.toFixed(1) || 'N/A'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const chartData = prepareChartData();
    
    if (chartData.length === 0) {
      return (
        <div className="no-chart-data">
          <p>No data available for chart visualization</p>
        </div>
      );
    }

    const commonProps = {
      width: 800,
      height: 400,
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (selectedChart) {
      case 'overall':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="overall_severity"
                stroke="#667eea"
                fill="#667eea"
                fillOpacity={0.3}
                name="Overall Severity"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'rhinitis':
        if (!data?.patient?.conditions?.rhinitis) {
          return <div className="no-chart-data">Patient does not have rhinitis condition</div>;
        }
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="rhinitis_avg"
                stroke="#48bb78"
                strokeWidth={3}
                name="Rhinitis Avg"
                dot={{ fill: '#48bb78', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'vertigo':
        if (!data?.patient?.conditions?.vertigo) {
          return <div className="no-chart-data">Patient does not have vertigo condition</div>;
        }
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="vertigo_severity"
                stroke="#ed8936"
                strokeWidth={3}
                name="Vertigo Severity"
                dot={{ fill: '#ed8936', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'tinnitus':
        if (!data?.patient?.conditions?.tinnitus) {
          return <div className="no-chart-data">Patient does not have tinnitus condition</div>;
        }
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="tinnitus_avg"
                stroke="#e53e3e"
                strokeWidth={3}
                name="Tinnitus Avg"
                dot={{ fill: '#e53e3e', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'combined':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="overall_severity"
                stroke="#667eea"
                strokeWidth={3}
                name="Overall"
                dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
              />
              {data?.patient?.conditions?.rhinitis && (
                <Line
                  type="monotone"
                  dataKey="rhinitis_avg"
                  stroke="#48bb78"
                  strokeWidth={2}
                  name="Rhinitis"
                  dot={{ fill: '#48bb78', strokeWidth: 2, r: 3 }}
                />
              )}
              {data?.patient?.conditions?.vertigo && (
                <Line
                  type="monotone"
                  dataKey="vertigo_severity"
                  stroke="#ed8936"
                  strokeWidth={2}
                  name="Vertigo"
                  dot={{ fill: '#ed8936', strokeWidth: 2, r: 3 }}
                />
              )}
              {data?.patient?.conditions?.tinnitus && (
                <Line
                  type="monotone"
                  dataKey="tinnitus_avg"
                  stroke="#e53e3e"
                  strokeWidth={2}
                  name="Tinnitus"
                  dot={{ fill: '#e53e3e', strokeWidth: 2, r: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Select a chart type</div>;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading patient analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container">
        <div className="error">{error || 'Failed to load data'}</div>
        <button onClick={() => navigate('/doctor/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const latestValues = getLatestValues();
  const averageValues = getAverageValues();

  return (
    <div className="container">
      <div className="nav">
        <div className="nav-title">Patient Analytics</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="nav-button" onClick={() => navigate(`/doctor/patient/${patientId}/logs`)}>
            📋 View Logs
          </button>
          <button 
            className="nav-button"
            onClick={() => navigate(`/doctor/patient/${patientId}/ai-analysis`)}
          >
            🤖 AI Analysis
          </button>
          <button className="nav-button" onClick={() => navigate('/doctor/dashboard')}>
            Dashboard
          </button>
        </div>
      </div>

      <div className="card">
        <div className="patient-header-section">
          <h1>📊 {data.patient.name || data.patient.username}</h1>
          <div className="patient-meta">
            <span>Patient ID: {data.patient.id}</span>
            <span>Total Logs: {data.total_logs}</span>
            {data.date_range.start && (
              <span>
                Data Range: {formatDate(data.date_range.start)} - {formatDate(data.date_range.end)}
              </span>
            )}
          </div>
        </div>

        {/* Condition Summary Cards */}
        <div className="summary-cards">
          {data.patient.conditions.rhinitis && (
            <div className="summary-card rhinitis">
              <div className="summary-header">
                <span className="summary-icon">🌿</span>
                <span className="summary-title">Rhinitis</span>
                <span className="summary-trend" style={{ color: getTrendColor(calculateTrend(data.chart_data, 'rhinitis_avg')) }}>
                  {getTrendIcon(calculateTrend(data.chart_data, 'rhinitis_avg'))}
                </span>
              </div>
              <div className="summary-values">
                <div className="summary-stat">
                  <span className="stat-label">Current</span>
                  <span className="stat-value">{latestValues.rhinitis?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Average</span>
                  <span className="stat-value">{averageValues.rhinitis?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {data.patient.conditions.vertigo && (
            <div className="summary-card vertigo">
              <div className="summary-header">
                <span className="summary-icon">💫</span>
                <span className="summary-title">Vertigo</span>
                <span className="summary-trend" style={{ color: getTrendColor(calculateTrend(data.chart_data, 'vertigo_severity')) }}>
                  {getTrendIcon(calculateTrend(data.chart_data, 'vertigo_severity'))}
                </span>
              </div>
              <div className="summary-values">
                <div className="summary-stat">
                  <span className="stat-label">Current</span>
                  <span className="stat-value">{latestValues.vertigo || 'N/A'}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Average</span>
                  <span className="stat-value">{averageValues.vertigo?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {data.patient.conditions.tinnitus && (
            <div className="summary-card tinnitus">
              <div className="summary-header">
                <span className="summary-icon">🔊</span>
                <span className="summary-title">Tinnitus</span>
                <span className="summary-trend" style={{ color: getTrendColor(calculateTrend(data.chart_data, 'tinnitus_avg')) }}>
                  {getTrendIcon(calculateTrend(data.chart_data, 'tinnitus_avg'))}
                </span>
              </div>
              <div className="summary-values">
                <div className="summary-stat">
                  <span className="stat-label">Current</span>
                  <span className="stat-value">{latestValues.tinnitus?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Average</span>
                  <span className="stat-value">{averageValues.tinnitus?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart Navigation */}
        <div className="chart-navigation">
          <button 
            className={`chart-nav-button ${selectedChart === 'overall' ? 'active' : ''}`}
            onClick={() => setSelectedChart('overall')}
          >
            📊 Overall Trend
          </button>
          {data.patient.conditions.rhinitis && (
            <button 
              className={`chart-nav-button ${selectedChart === 'rhinitis' ? 'active' : ''}`}
              onClick={() => setSelectedChart('rhinitis')}
            >
              🌿 Rhinitis
            </button>
          )}
          {data.patient.conditions.vertigo && (
            <button 
              className={`chart-nav-button ${selectedChart === 'vertigo' ? 'active' : ''}`}
              onClick={() => setSelectedChart('vertigo')}
            >
              💫 Vertigo
            </button>
          )}
          {data.patient.conditions.tinnitus && (
            <button 
              className={`chart-nav-button ${selectedChart === 'tinnitus' ? 'active' : ''}`}
              onClick={() => setSelectedChart('tinnitus')}
            >
              🔊 Tinnitus
            </button>
          )}
          <button 
            className={`chart-nav-button ${selectedChart === 'combined' ? 'active' : ''}`}
            onClick={() => setSelectedChart('combined')}
          >
            📈 Combined View
          </button>
        </div>

        {/* Interactive Charts */}
        <div className="charts-container">
          <div className="chart-section">
            <h3>
              {selectedChart === 'overall' && '📊 Overall Symptom Severity'}
              {selectedChart === 'rhinitis' && '🌿 Rhinitis Trends'}
              {selectedChart === 'vertigo' && '💫 Vertigo Trends'}
              {selectedChart === 'tinnitus' && '🔊 Tinnitus Trends'}
              {selectedChart === 'combined' && '📈 All Symptoms Combined'}
            </h3>
            {renderChart()}
          </div>
        </div>

        {/* Data Table */}
        <div className="data-table-section">
          <h3>📊 Recent Symptom History</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Overall</th>
                  {data.patient.conditions.rhinitis && <th>Rhinitis</th>}
                  {data.patient.conditions.vertigo && <th>Vertigo</th>}
                  {data.patient.conditions.tinnitus && <th>Tinnitus</th>}
                </tr>
              </thead>
              <tbody>
                {data.chart_data.slice(-10).reverse().map((entry, index) => (
                  <tr key={index}>
                    <td>{formatDate(entry.date)}</td>
                    <td>
                      <span className={`severity-badge severity-${Math.floor(entry.overall_severity)}`}>
                        {entry.overall_severity?.toFixed(1)}
                      </span>
                    </td>
                    {data.patient.conditions.rhinitis && (
                      <td>{entry.rhinitis_avg?.toFixed(1) || 'N/A'}</td>
                    )}
                    {data.patient.conditions.vertigo && (
                      <td>{entry.vertigo_severity || 'N/A'}</td>
                    )}
                    {data.patient.conditions.tinnitus && (
                      <td>{entry.tinnitus_avg?.toFixed(1) || 'N/A'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights Section */}
        <div className="insights-section">
          <h3>📊 Key Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>Activity Level</h4>
              <p>
                Patient has logged {data.total_logs} entries
                {data.date_range.start && (
                  <> over {Math.ceil((new Date(data.date_range.end) - new Date(data.date_range.start)) / (1000 * 60 * 60 * 24))} days</>
                )}
              </p>
            </div>
            {data.chart_data.length > 5 && (
              <div className="insight-card">
                <h4>Trend Analysis</h4>
                <p>
                  Overall severity trend: <strong style={{ color: getTrendColor(calculateTrend(data.chart_data, 'overall_severity')) }}>
                    {calculateTrend(data.chart_data, 'overall_severity')}
                  </strong>
                </p>
              </div>
            )}
            <div className="insight-card">
              <h4>Most Recent Entry</h4>
              <p>
                {data.chart_data.length > 0 
                  ? `Overall severity: ${latestValues.overall?.toFixed(1)} on ${formatDate(data.chart_data[data.chart_data.length - 1].date)}`
                  : 'No recent entries'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientAnalytics;