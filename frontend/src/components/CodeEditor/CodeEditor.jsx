import React, { forwardRef, useImperativeHandle } from 'react';
import './CodeEditor.css';

const CodeEditor = forwardRef(({ 
  code, 
  onChange, 
  errors = [], 
  highlightedLine = null,
  onLineClick 
}, ref) => {
  
  // Exponer métodos al componente padre
  useImperativeHandle(ref, () => ({
    highlightLine: (lineNumber) => {
      // Implementar lógica de resaltado de línea
      console.log(`Resaltar línea: ${lineNumber}`);
    },
    clearHighlight: () => {
      // Implementar limpieza de resaltado
      console.log('Limpiar resaltado');
    },
    gotoLine: (lineNumber, column = 0) => {
      // Implementar navegación a línea específica
      console.log(`Navegar a línea: ${lineNumber}, columna: ${column}`);
      // Aquí podrías enfocar el textarea y mover el cursor
    }
  }));

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  // Calcular líneas con errores
  const errorLines = errors.map(error => {
    const lineMatch = error.match(/línea\s+(\d+)/i);
    return lineMatch ? parseInt(lineMatch[1]) : null;
  }).filter(line => line !== null);

  return (
    <div className="code-editor">
      <div className="editor-header">
        <h3>Editor de Código</h3>
        <div className="editor-info">
          {highlightedLine && (
            <span className="line-highlight-info">
              Línea {highlightedLine} resaltada desde AST
            </span>
          )}
        </div>
      </div>
      
      <div className="editor-container">
        <div className="line-numbers">
          {code.split('\n').map((_, index) => {
            const lineNumber = index + 1;
            const hasError = errorLines.includes(lineNumber);
            const isHighlighted = highlightedLine === lineNumber;
            
            return (
              <div 
                key={lineNumber}
                className={`line-number ${
                  hasError ? 'error-line' : ''} ${
                  isHighlighted ? 'highlighted-line' : ''
                }`}
                onClick={() => onLineClick && onLineClick(lineNumber)}
              >
                {lineNumber}
              </div>
            );
          })}
        </div>
        
        <textarea
          className="code-input"
          value={code}
          onChange={handleChange}
          placeholder="Escribe tu código aquí..."
          spellCheck="false"
          style={{
            background: highlightedLine ? 
              `linear-gradient(to bottom, 
                transparent 0%, 
                transparent ${(highlightedLine - 1) * 1.5}em,
                rgba(255, 255, 0, 0.2) ${(highlightedLine - 1) * 1.5}em,
                rgba(255, 255, 0, 0.2) ${highlightedLine * 1.5}em,
                transparent ${highlightedLine * 1.5}em,
                transparent 100%)` 
              : 'white'
          }}
        />
      </div>
      
      {errors.length > 0 && (
        <div className="errors-panel">
          <h4>Errores:</h4>
          <ul>
            {errors.map((error, index) => (
              <li key={index} className="error-item">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

export default CodeEditor;