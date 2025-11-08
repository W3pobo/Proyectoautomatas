import React from 'react';
import './CodeEditor.css';

const CodeEditor = ({ code, onChange, errors }) => {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <div className="code-editor">
      <h3>Editor de Código</h3>
      <div className="editor-container">
        <textarea
          value={code}
          onChange={handleChange}
          className="code-textarea"
          placeholder="// Escribe tu código aquí..."
          spellCheck="false"
        />
      </div>
      
      {errors && errors.length > 0 && (
        <div className="errors-panel">
          <h4>Errores:</h4>
          {errors.map((error, index) => (
            <div key={index} className="error-item">
              <span className="error-line">Línea {error.line}:</span>
              <span className="error-message">{error.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;