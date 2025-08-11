import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles.css';
import config from './config';

function AIAnalysis() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/doctor/patient/<int:patient_id>/analytics`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch patient data');
      }

      const data = await response.json();
      setPatientData(data);
      
      // Generate AI analysis automatically
      generateAIAnalysis(data);
    } catch (error) {
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const generateAIAnalysis = async (data) => {
    setGenerating(true);
    
    // Simulate AI analysis - In real implementation, this would call your AI service
    // You can integrate with OpenAI, local ML models, or custom analytics
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analysis = analyzePatientData(data);
      setAiPrediction(analysis);
    } catch (error) {
      setError('Failed to generate AI analysis');
    } finally {
      setGenerating(false);
    }
  };

  // Simulated AI Analysis Function
  const analyzePatientData = (data) => {
    const chartData = data.chart_data || [];
    const patient = data.patient;
    
    if (chartData.length < 3) {
      return {
        prediction_type: 'insufficient_data',
        confidence_score: 0.3,
        prediction_text: 'Insufficient data for accurate predictions. Need at least 3 symptom logs.',
        recommendations: [
          'Encourage patient to log symptoms more regularly',
          'Schedule follow-up in 2 weeks',
          'Consider baseline symptom assessment'
        ],
        risk_factors: [],
        improvement_indicators: [],
        concerns: ['Limited data availability']
      };
    }

    // Calculate trends for each condition
    const trends = {
      overall: calculateTrend(chartData, 'overall_severity'),
      rhinitis: patient.conditions.rhinitis ? calculateTrend(chartData, 'rhinitis_avg') : null,
      vertigo: patient.conditions.vertigo ? calculateTrend(chartData, 'vertigo_severity') : null,
      tinnitus: patient.conditions.tinnitus ? calculateTrend(chartData, 'tinnitus_avg') : null
    };

    // Calculate severity statistics
    const recentData = chartData.slice(-7); // Last 7 entries
    const averageSeverity = recentData.reduce((sum, d) => sum + d.overall_severity, 0) / recentData.length;
    const maxSeverity = Math.max(...recentData.map(d => d.overall_severity));
    const variability = calculateVariability(recentData.map(d => d.overall_severity));

    // Determine prediction type and confidence
    let predictionType, confidence, predictionText;
    
    if (trends.overall === 'improving') {
      predictionType = 'improvement';
      confidence = 0.75 + (variability < 1 ? 0.15 : 0);
      predictionText = `Patient shows strong signs of improvement. Overall symptom severity has decreased by an average of ${((chartData[0]?.overall_severity || 0) - averageSeverity).toFixed(1)} points over the tracking period.`;
    } else if (trends.overall === 'worsening') {
      predictionType = 'deterioration';
      confidence = 0.7 + (variability < 1 ? 0.2 : 0);
      predictionText = `Patient condition appears to be worsening. Recent symptom severity has increased, with current average at ${averageSeverity.toFixed(1)}/5. Immediate attention recommended.`;
    } else {
      predictionType = 'stable';
      confidence = 0.65;
      predictionText = `Patient condition remains stable with minimal fluctuation. Average severity maintained at ${averageSeverity.toFixed(1)}/5 over recent entries.`;
    }

    // Generate recommendations based on analysis
    const recommendations = generateRecommendations(trends, averageSeverity, maxSeverity, variability, patient.conditions);
    const riskFactors = identifyRiskFactors(trends, averageSeverity, maxSeverity, variability);
    const improvementIndicators = identifyImprovementIndicators(trends, chartData);
    const concerns = identifyConcerns(trends, averageSeverity, maxSeverity, variability);

    return {
      prediction_type: predictionType,
      confidence_score: Math.min(confidence, 0.95), // Cap at 95%
      prediction_text: predictionText,
      recommendations,
      risk_factors: riskFactors,
      improvement_indicators: improvementIndicators,
      concerns,
      analysis_date: new Date().toISOString(),
      data_points_analyzed: chartData.length,
      conditions_tracked: Object.entries(patient.conditions).filter(([_, active]) => active).map(([condition, _]) => condition)
    };
  };

  const calculateTrend = (data, field) => {
    if (data.length < 2) return 'stable';
    
    const validData = data.filter(d => d[field] !== null && d[field] !== undefined);
    if (validData.length < 2) return 'stable';
    
    const recent = validData.slice(-3).reduce((sum, d) => sum + d[field], 0) / 3;
    const earlier = validData.slice(0, 3).reduce((sum, d) => sum + d[field], 0) / 3;
    
    const change = ((recent - earlier) / earlier) * 100;
    
    if (change > 10) return 'worsening';
    if (change < -10) return 'improving';
    return 'stable';
  };

  const calculateVariability = (values) => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  };

  const generateRecommendations = (trends, avgSeverity, maxSeverity, variability, conditions) => {
    const recommendations = [];

    // General recommendations based on severity
    if (avgSeverity >= 4) {
      recommendations.push('Consider immediate consultation with specialist');
      recommendations.push('Review current treatment plan effectiveness');
    } else if (avgSeverity >= 3) {
      recommendations.push('Monitor symptoms closely and consider treatment adjustment');
      recommendations.push('Schedule follow-up appointment within 2 weeks');
    } else if (avgSeverity >= 2) {
      recommendations.push('Continue current treatment plan');
      recommendations.push('Encourage consistent symptom logging');
    } else {
      recommendations.push('Maintain current management approach');
      recommendations.push('Consider gradual treatment reduction if appropriate');
    }

    // Variability-based recommendations
    if (variability > 1.5) {
      recommendations.push('High symptom variability detected - investigate potential triggers');
      recommendations.push('Consider keeping a trigger diary');
    }

    // Condition-specific recommendations
    if (conditions.rhinitis && trends.rhinitis === 'worsening') {
      recommendations.push('Review environmental allergen exposure');
      recommendations.push('Consider nasal irrigation therapy');
    }

    if (conditions.vertigo && trends.vertigo === 'worsening') {
      recommendations.push('Assess for vestibular rehabilitation therapy');
      recommendations.push('Review medication side effects that may affect balance');
    }

    if (conditions.tinnitus && trends.tinnitus === 'worsening') {
      recommendations.push('Evaluate hearing protection and noise exposure');
      recommendations.push('Consider tinnitus retraining therapy');
    }

    // Improvement recommendations
    if (trends.overall === 'improving') {
      recommendations.push('Current treatment appears effective - continue approach');
      recommendations.push('Document successful strategies for future reference');
    }

    return recommendations;
  };

  const identifyRiskFactors = (trends, avgSeverity, maxSeverity, variability) => {
    const riskFactors = [];

    if (trends.overall === 'worsening') {
      riskFactors.push('Deteriorating symptom pattern');
    }

    if (maxSeverity >= 4) {
      riskFactors.push('High peak symptom severity');
    }

    if (variability > 2) {
      riskFactors.push('Highly variable symptom patterns');
    }

    if (avgSeverity >= 3.5) {
      riskFactors.push('Consistently high symptom severity');
    }

    return riskFactors;
  };

  const identifyImprovementIndicators = (trends, chartData) => {
    const indicators = [];

    if (trends.overall === 'improving') {
      indicators.push('Overall symptom severity trending downward');
    }

    if (trends.rhinitis === 'improving') {
      indicators.push('Rhinitis symptoms showing improvement');
    }

    if (trends.vertigo === 'improving') {
      indicators.push('Vertigo episodes decreasing in severity');
    }

    if (trends.tinnitus === 'improving') {
      indicators.push('Tinnitus impact reducing over time');
    }

    // Check for consistency
    const recentData = chartData.slice(-5);
    const isConsistent = recentData.every(d => d.overall_severity <= 3);
    if (isConsistent && recentData.length >= 3) {
      indicators.push('Consistent moderate-to-low symptom levels');
    }

    return indicators;
  };

  const identifyConcerns = (trends, avgSeverity, maxSeverity, variability) => {
    const concerns = [];

    if (trends.overall === 'worsening') {
      concerns.push('Worsening symptom trajectory requires attention');
    }

    if (avgSeverity >= 4) {
      concerns.push('High average symptom severity affecting quality of life');
    }

    if (variability > 2) {
      concerns.push('High symptom variability may indicate uncontrolled triggers');
    }

    if (maxSeverity === 5) {
      concerns.push('Maximum severity episodes recorded');
    }

    return concerns;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#38a169';
    if (confidence >= 0.6) return '#d69e2e';
    return '#e53e3e';
  };

  const getPredictionIcon = (type) => {
    switch (type) {
      case 'improvement': return '📈';
      case 'deterioration': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const getPredictionColor = (type) => {
    switch (type) {
      case 'improvement': return '#38a169';
      case 'deterioration': return '#e53e3e';
      case 'stable': return '#667eea';
      default: return '#718096';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading AI analysis...</div>
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
        <div className="nav-title">AI Analysis</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="nav-button" onClick={() => navigate(`/doctor/patient/${patientId}`)}>
            Analytics
          </button>
          <button className="nav-button" onClick={() => navigate('/doctor/dashboard')}>
            Dashboard
          </button>
        </div>
      </div>

      <div className="card">
        <div className="ai-header">
          <h1>AI Analysis Report</h1>
          <div className="patient-info">
            <h2>{patientData?.patient.name || patientData?.patient.username}</h2>
            <p>Analysis generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {generating ? (
          <div className="ai-generating">
            <div className="loading-spinner"></div>
            <h3>🧠 Analyzing patient data...</h3>
            <p>Processing symptom patterns and generating insights</p>
          </div>
        ) : aiPrediction ? (
          <div className="ai-results">
            {/* Main Prediction */}
            <div className="prediction-card">
              <div className="prediction-header">
                <span className="prediction-icon" style={{ fontSize: '2em' }}>
                  {getPredictionIcon(aiPrediction.prediction_type)}
                </span>
                <div className="prediction-main">
                  <h3 style={{ color: getPredictionColor(aiPrediction.prediction_type) }}>
                    {aiPrediction.prediction_type.charAt(0).toUpperCase() + aiPrediction.prediction_type.slice(1)} Predicted
                  </h3>
                  <div className="confidence-badge" style={{ backgroundColor: getConfidenceColor(aiPrediction.confidence_score) }}>
                    {Math.round(aiPrediction.confidence_score * 100)}% Confidence
                  </div>
                </div>
              </div>
              <p className="prediction-text">{aiPrediction.prediction_text}</p>
              
              <div className="analysis-meta">
                <span>📊 {aiPrediction.data_points_analyzed} data points analyzed</span>
                <span>🎯 Tracking: {aiPrediction.conditions_tracked.join(', ')}</span>
              </div>
            </div>

            {/* Recommendations */}
            <div className="ai-section">
              <h3>💡 Clinical Recommendations</h3>
              <div className="recommendations-list">
                {aiPrediction.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <span className="recommendation-bullet">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors & Concerns */}
            {(aiPrediction.risk_factors.length > 0 || aiPrediction.concerns.length > 0) && (
              <div className="ai-section warning">
                <h3>⚠️ Risk Factors & Concerns</h3>
                <div className="concerns-grid">
                  {aiPrediction.risk_factors.map((risk, index) => (
                    <div key={index} className="concern-item risk">
                      <span className="concern-icon">🚨</span>
                      <span>{risk}</span>
                    </div>
                  ))}
                  {aiPrediction.concerns.map((concern, index) => (
                    <div key={index} className="concern-item concern">
                      <span className="concern-icon">⚠️</span>
                      <span>{concern}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Indicators */}
            {aiPrediction.improvement_indicators.length > 0 && (
              <div className="ai-section positive">
                <h3>✅ Positive Indicators</h3>
                <div className="improvements-list">
                  {aiPrediction.improvement_indicators.map((indicator, index) => (
                    <div key={index} className="improvement-item">
                      <span className="improvement-icon">✨</span>
                      <span>{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Disclaimer */}
            <div className="ai-disclaimer">
              <h4>📋 Important Notice</h4>
              <p>
                This AI analysis is designed to assist clinical decision-making and should not replace professional medical judgment. 
                Always consider individual patient factors, clinical history, and current best practices when making treatment decisions.
              </p>
              <p>
                <strong>Accuracy Note:</strong> AI predictions improve with more data points. 
                Encourage patients to maintain consistent symptom logging for better insights.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="ai-actions">
              <button 
                className="action-button primary"
                onClick={() => generateAIAnalysis(patientData)}
                disabled={generating}
              >
                🔄 Regenerate Analysis
              </button>
              <button 
                className="action-button secondary"
                onClick={() => navigate(`/doctor/patient/${patientId}`)}
              >
                📊 View Raw Data
              </button>
              <button 
                className="action-button secondary"
                onClick={() => window.print()}
              >
                🖨️ Print Report
              </button>
            </div>
          </div>
        ) : (
          <div className="ai-error">
            <h3>❌ Analysis Failed</h3>
            <p>Unable to generate AI analysis. Please try again.</p>
            <button onClick={() => generateAIAnalysis(patientData)}>
              Retry Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAnalysis;