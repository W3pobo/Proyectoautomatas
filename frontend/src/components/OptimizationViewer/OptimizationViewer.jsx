import React from 'react';
import './OptimizationViewer.css';

const OptimizationViewer = ({ original, optimized }) => {
    if (!original || !optimized) {
        return (
            <div className="optimization-viewer">
                <h3>⚡ Optimización de Código</h3>
                <div className="placeholder">
                    <p>Compila un programa para visualizar las optimizaciones</p>
                </div>
            </div>
        );
    }

    const reduction = ((original.length - optimized.length) / original.length) * 100;

    return (
        <div className="optimization-viewer">
            <h3>⚡ Optimización de Código</h3>
            
            <div className="optimization-stats">
                <div className="stat-card">
                    <span className="stat-value">{original.length}</span>
                    <span className="stat-label">Cuádruplos Originales</span>
                </div>
                <div className="stat-card optimized">
                    <span className="stat-value">{optimized.length}</span>
                    <span className="stat-label">Cuádruplos Optimizados</span>
                </div>
                <div className={`stat-card reduction ${reduction > 0 ? 'positive' : 'neutral'}`}>
                    <span className="stat-value">{reduction.toFixed(1)}%</span>
                    <span className="stat-label">Reducción</span>
                </div>
            </div>

            <div className="comparison-view">
                <div className="code-column">
                    <h4>📄 Código Original</h4>
                    <div className="code-container">
                        {original.map((quad, index) => (
                            <div key={index} className="quadruple-line">
                                <span className="quad-index">[{quad.index}]</span>
                                <span className="quad-operator">{quad.operator}</span>
                                <span className="quad-arg">{quad.arg1 || ''}</span>
                                <span className="quad-arg">{quad.arg2 || ''}</span>
                                <span className="quad-result">{quad.result || ''}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="code-column">
                    <h4>🚀 Código Optimizado</h4>
                    <div className="code-container">
                        {optimized.map((quad, index) => (
                            <div key={index} className="quadruple-line optimized">
                                <span className="quad-index">[{quad.index}]</span>
                                <span className="quad-operator">{quad.operator}</span>
                                <span className="quad-arg">{quad.arg1 || ''}</span>
                                <span className="quad-arg">{quad.arg2 || ''}</span>
                                <span className="quad-result">{quad.result || ''}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OptimizationViewer;