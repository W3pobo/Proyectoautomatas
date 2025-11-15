import React from 'react';
import './OptimizationViewer.css';

const OptimizationViewer = ({ original, optimized }) => {
    
    // --- 1. CORRECCIÓN: Extraer los arrays de los objetos ---
    const originalQuads = original?.quadruples;
    const optimizedQuads = optimized?.quadruples;

    if (!originalQuads || !optimizedQuads) {
        return (
            <div className="optimization-viewer">
                <h3>⚡ Optimización de Código</h3>
                <div className="placeholder">
                    <p>Compila un programa para visualizar las optimizaciones</p>
                </div>
            </div>
        );
    }

    // --- 2. CORRECCIÓN: Calcular la reducción usando .length en los arrays ---
    const reduction = ((originalQuads.length - optimizedQuads.length) / originalQuads.length) * 100;

    return (
        <div className="optimization-viewer">
            <h3>⚡ Optimización de Código</h3>
            
            <div className="optimization-stats">
                <div className="stat-card">
                    {/* --- 3. CORRECCIÓN: Usar .length en el array --- */}
                    <span className="stat-value">{originalQuads.length}</span>
                    <span className="stat-label">Cuádruplos Originales</span>
                </div>
                <div className="stat-card optimized">
                    <span className="stat-value">{optimizedQuads.length}</span>
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
                        {/* --- 4. CORRECCIÓN: Hacer .map() sobre el array --- */}
                        {originalQuads.map((quad, index) => (
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
                        {/* --- 5. CORRECCIÓN: Hacer .map() sobre el array --- */}
                        {optimizedQuads.map((quad, index) => (
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