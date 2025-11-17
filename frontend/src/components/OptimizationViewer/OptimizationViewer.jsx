import React from 'react';
import './OptimizationViewer.css';

const OptimizationViewer = ({ original, optimized }) => {
  const renderQuadruples = (quads, title, isOptimized = false) => {
    if (!quads || !quads.quadruples || quads.quadruples.length === 0) {
      return (
        <div className="code-panel">
          <h4>{title}</h4>
          <div className={`code-block ${isOptimized ? 'optimized' : 'original'}`}>
            <div className="placeholder">
              {isOptimized ? 'No hay código optimizado disponible' : 'No hay código intermedio disponible'}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="code-panel">
        <h4>{title}</h4>
        <div className={`code-block ${isOptimized ? 'optimized' : 'original'}`}>
          {quads.quadruples.map((quad, index) => (
            <div key={index} className="quadruple-line">
              <span className="line-number">{index + 1}</span>
              <span className="quad-content">
                {quad.index !== undefined ? `[${quad.index}]` : `[${index}]`} - {quad.operator} {quad.arg1 || ''} {quad.arg2 || ''} {quad.result || ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const calculateStats = () => {
    if (!original || !optimized) return null;

    const originalCount = original.quadruples ? original.quadruples.length : 0;
    const optimizedCount = optimized.quadruples ? optimized.quadruples.length : 0;
    const reduction = originalCount > 0 ? ((originalCount - optimizedCount) / originalCount) * 100 : 0;

    return {
      originalCount,
      optimizedCount,
      reduction: Math.round(reduction * 100) / 100
    };
  };

  const stats = calculateStats();

  return (
    <div className="optimization-viewer">
      <h3>Optimización de Código</h3>
      
      {stats && (
        <div className="optimization-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.originalCount}</div>
            <div className="stat-label">Cuádruplos Originales</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.optimizedCount}</div>
            <div className="stat-label">Cuádruplos Optimizados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.reduction}%</div>
            <div className="stat-label">Reducción</div>
            {stats.reduction > 0 && (
              <div className="stat-improvement">✓ Mejora aplicada</div>
            )}
            {stats.reduction === 0 && (
              <div className="stat-label">Sin cambios</div>
            )}
          </div>
        </div>
      )}

      <div className="comparison-container">
        {renderQuadruples(original, "Código Original", false)}
        {renderQuadruples(optimized, "Código Optimizado", true)}
      </div>

      {(!original && !optimized) && (
        <div className="placeholder">
          Compila un programa para ver la optimización de código
        </div>
      )}
    </div>
  );
};

export default OptimizationViewer;