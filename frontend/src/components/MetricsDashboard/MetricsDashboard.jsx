import React from 'react';
import './MetricsDashboard.css';

const MetricsDashboard = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="metrics-dashboard">
        <h3>Métricas de Compilación</h3>
        <div className="placeholder">
          Compila un programa para ver las métricas
        </div>
      </div>
    );
  }

  const formatValue = (value, key) => {
    if (value === undefined || value === null) return '0';
    
    // Formatear tiempo de compilación
    if (key === 'compilation_time') {
      const timeMs = value * 1000; // convertir a milisegundos
      if (timeMs < 1) {
        return `${timeMs.toFixed(6)} ms`;
      } else if (timeMs < 1000) {
        return `${timeMs.toFixed(3)} ms`;
      } else {
        return `${(timeMs / 1000).toFixed(3)} s`;
      }
    }
    
    // Formatear porcentajes
    if (typeof value === 'number' && key.includes('reduction')) {
      return `${value.toFixed(1)}%`;
    }
    
    // Para números grandes, formatear con separadores
    if (typeof value === 'number' && value > 1000) {
      return value.toLocaleString();
    }
    
    return value.toString();
  };

  const getValueClass = (value, key) => {
    const strValue = value.toString();
    
    // Determinar si el valor es largo para ajustar el tamaño de fuente
    if (strValue.length > 15) return 'very-long';
    if (strValue.length > 10) return 'long-value';
    
    // Colores basados en el tipo de métrica
    if (key === 'errors_count' && value > 0) return 'error';
    if (key === 'compilation_time' && value > 1) return 'warning';
    if (key.includes('reduction') && value > 0) return 'success';
    
    return '';
  };

  const getCardClass = (key) => {
    const classMap = {
      compilation_time: 'compilation-time',
      tokens_count: 'tokens-count',
      ast_nodes_count: 'ast-nodes',
      symbols_count: 'symbols-count',
      errors_count: 'errors-count',
      warnings_count: 'errors-count',
      quadruples_count: 'intermediate-lines',
      temporals_count: 'intermediate-lines'
    };
    return classMap[key] || '';
  };

  const metricLabels = {
    compilation_time: 'TIEMPO DE COMPILACIÓN',
    tokens_count: 'TOKENS GENERADOS',
    ast_nodes_count: 'NODOS EN AST',
    symbols_count: 'SÍMBOLOS EN TABLA',
    errors_count: 'ERRORES ENCONTRADOS',
    warnings_count: 'ADVERTENCIAS',
    quadruples_count: 'CUÁDRUPLOS',
    temporals_count: 'VARIABLES TEMPORALES',
    optimization_reduction: 'REDUCCIÓN POR OPTIMIZACIÓN'
  };

  const importantMetrics = [
    'compilation_time',
    'tokens_count', 
    'quadruples_count',
    'optimization_reduction',
    'symbols_count',
    'errors_count'
  ];

  return (
    <div className="metrics-dashboard">
      <h3>✅ Métricas de Compilación</h3>
      
      <div className="metrics-grid">
        {importantMetrics.map(key => {
          const value = metrics[key];
          const formattedValue = formatValue(value, key);
          const valueClass = getValueClass(formattedValue, key);
          const cardClass = getCardClass(key);
          
          return (
            <div key={key} className={`metric-card ${cardClass}`}>
              <h4>{metricLabels[key] || key}</h4>
              <div className="value-container">
                <div className={`metric-value ${valueClass}`}>
                  {formattedValue}
                </div>
              </div>
              {/* Tooltip para valores largos */}
              {formattedValue.length > 10 && (
                <div className="tooltip">
                  {formattedValue}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Métricas adicionales si existen */}
        {Object.keys(metrics)
          .filter(key => !importantMetrics.includes(key))
          .map(key => {
            const value = metrics[key];
            const formattedValue = formatValue(value, key);
            const valueClass = getValueClass(formattedValue, key);
            const cardClass = getCardClass(key);
            
            return (
              <div key={key} className={`metric-card ${cardClass}`}>
                <h4>{metricLabels[key] || key.toUpperCase()}</h4>
                <div className="value-container">
                  <div className={`metric-value ${valueClass}`}>
                    {formattedValue}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default MetricsDashboard;