import React, { useState, useEffect } from 'react';
import './QuadruplesViewer.css';

// 1. Aceptamos la nueva prop 'isStepMode'
const QuadruplesViewer = ({ intermediateCode, isStepMode }) => {
    
    // El array de cuádruplos está dentro del objeto
    const quads = intermediateCode?.quadruples;

    // --- 2. AÑADIMOS ESTADO INTERNO PARA EL CONTEO ---
    const [currentStep, setCurrentStep] = useState(0);

    // --- 3. RESETEAMOS EL CONTEO SI EL CÓDIGO CAMBIA ---
    useEffect(() => {
        // Si estamos en modo paso a paso, empezamos en 0
        // Si no, mostramos todos
        setCurrentStep(isStepMode ? 0 : (quads?.length || 0));
    }, [intermediateCode, isStepMode, quads?.length]);


    // --- 4. CREAMOS LA LISTA DE CUÁDRUPLOS VISIBLES ---
    const visibleQuads = isStepMode 
        ? quads?.slice(0, currentStep) 
        : quads;

    // --- 5. MANEJADORES PARA LOS NUEVOS CONTROLES ---
    const handleNext = () => {
        setCurrentStep(s => Math.min(s + 1, quads.length));
    };
    const handlePrev = () => {
        setCurrentStep(s => Math.max(s - 1, 0));
    };
    const handleReset = () => {
        setCurrentStep(0);
    };
    const handleShowAll = () => {
        setCurrentStep(quads.length);
    };

    // --- 6. SI NO HAY DATOS, MOSTRAMOS EL PLACEHOLDER ---
    if (!quads || quads.length === 0) {
        return (
            <div className="quadruples-visualizer">
                <h3>🔄 Código Intermedio - Cuádruplos</h3>
                <div className="placeholder">
                    <p>Compila un programa para visualizar los Cuádruplos</p>
                </div>
            </div>
        );
    }

    // ... (tus funciones getOperatorSymbol y getRowClass se quedan igual) ...
    const getOperatorSymbol = (operator, type) => { /* ... (sin cambios) ... */ };
    const getRowClass = (quad) => { /* ... (sin cambios) ... */ };

    return (
        <div className="quadruples-visualizer">
            <h3>🔄 Código Intermedio - Cuádruplos</h3>

            {/* --- 7. MOSTRAMOS LOS CONTROLES DE PASOS --- */}
            {isStepMode && (
                <div className="step-controls">
                    <button onClick={handleReset} disabled={currentStep === 0}>
                        Reset
                    </button>
                    <button onClick={handlePrev} disabled={currentStep === 0}>
                        Anterior
                    </button>
                    <span className="step-counter">
                        Paso: {currentStep} / {quads.length}
                    </span>
                    <button onClick={handleNext} disabled={currentStep === quads.length}>
                        Siguiente
                    </button>
                    <button onClick={handleShowAll} disabled={currentStep === quads.length}>
                        Mostrar Todo
                    </button>
                </div>
            )}
            
            <div className="quadruples-summary">
                {/* Mostramos el total real, no el visible */}
                <span className="summary-item">
                    Total: {quads.length} cuádruplos
                </span>
                <span className="summary-item">
                    Temporales: {intermediateCode.temporal_counter || 0}
                </span>
                <span className="summary-item">
                    Etiquetas: {intermediateCode.label_counter || 0}
                </span>
            </div>

            <div className="quadruples-container">
                <table className="quadruples-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Operador</th>
                            <th>Arg1</th>
                            <th>Arg2</th>
                            <th>Resultado</th>
                            <th>Tipo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* --- 8. MAPEAMOS SOBRE LOS CUÁDRUPLOS VISIBLES --- */}
                        {visibleQuads.map((quad, index) => (
                            <tr key={index} className={getRowClass(quad)}>
                                <td className="quad-index">{quad.index}</td>
                                <td className="quad-operator">
                                    <span className="operator-symbol">
                                        {getOperatorSymbol(quad.operator, quad.quadruple_type)}
                                    </span>
                                    {quad.operator && (
                                        <span className="operator-text">{quad.operator}</span>
                                    )}
                                </td>
                                <td className="quad-arg">{quad.arg1 || '-'}</td>
                                <td className="quad-arg">{quad.arg2 || '-'}</td>
                                <td className="quad-result">
                                    {quad.result ? (
                                        <span className={`
                                            ${quad.result.startsWith('t') ? 'temporal' : ''}
                                            ${quad.result.startsWith('label') ? 'label' : ''}
                                            ${quad.quadruple_type === 'label' ? 'label-def' : ''}
                                        `}>
                                            {quad.result}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="quad-type">
                                    <span className={`type-badge ${quad.quadruple_type}`}>
                                        {quad.quadruple_type}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="quadruples-legend">
                {/* ... (Tu leyenda se queda igual) ... */}
            </div>
        </div>
    );
};

export default QuadruplesViewer;