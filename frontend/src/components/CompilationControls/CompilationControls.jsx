import React from 'react';
import './CompilationControls.css';

const CompilationControls = ({ onCompile, onStepByStep, loading }) => {
  return (
    <div className="compilation-controls">
      <h3>Controles de Compilación</h3>
      <div className="controls-buttons">
        <button 
          className="btn btn-primary" 
          onClick={onCompile}
          disabled={loading}
        >
          {loading ? 'Compilando...' : 'Compilar'}
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={onStepByStep}
          disabled={loading}
        >
          Paso a Paso
        </button>
      </div>
      
      <div className="compilation-info">
        <p>Estado: {loading ? 'Compilando...' : 'Listo'}</p>
      </div>
    </div>
  );
};

export default CompilationControls;