import React from 'react';
import './MetricsDashboard.css';

const MetricsDashboard = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="metrics-dashboard">
        <h3>Métricas de Compilación</h3>
        <div className="placeholder">
          <p>No hay métricas disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-dashboard">
      <h3>Métricas de Compilación</h3>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Tiempo de Compilación</h4>
          <div className="metric-value">{metrics.compilation_time || 'N/A'} ms</div>
        </div>
        
        <div className="metric-card">
          <h4>Tokens Generados</h4>
          <div className="metric-value">{metrics.tokens_count || '0'}</div>
        </div>
        
        <div className="metric-card">
          <h4>Líneas de Código Intermedio</h4>
          <div className="metric-value">
            {metrics.quadruples_count || '0'}
          </div>
        </div> {/* <--- ESTA ES LA ETIQUETA QUE FALTABA */}
        
        <div className="metric-card">
          <h4>Reducción por Optimización</h4>
          <div className="metric-value">
            {metrics.optimization_reduction || '0'}%
          </div>
        </div>
        
        <div className="metric-card">
          <h4>Símbolos en Tabla</h4>
          <div className="metric-value">
            {metrics.symbols_count || '0'}
          </div>
        </div>
        
        <div className="metric-card">
          <h4>Errores Encontrados</h4>
          <div className="metric-value error">
            {metrics.errors_count || '0'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;