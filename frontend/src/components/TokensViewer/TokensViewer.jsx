import React from 'react';
import './TokensViewer.css';

const TokensViewer = ({ tokens, errors }) => {
  if (!tokens || tokens.length === 0) {
    return (
      <div className="tokens-viewer">
        <h3>Tokens - Análisis Léxico</h3>
        <div className="placeholder">
          <p>Compila un programa para ver los tokens generados</p>
        </div>
      </div>
    );
  }

  const getTokenColor = (type) => {
    const colors = {
      'KEYWORD': '#d73a49',
      'IDENTIFIER': '#6f42c1',
      'OPERATOR': '#005cc5',
      'DELIMITER': '#6a737d',
      'INTEGER': '#032f62',
      'FLOAT': '#032f62',
      'STRING': '#032f62',
      'CHAR': '#032f62'
    };
    return colors[type] || '#6a737d';
  };

  return (
    <div className="tokens-viewer">
      <h3>Tokens - Análisis Léxico</h3>
      
      <div className="tokens-info">
        <p>Total de tokens: {tokens.length}</p>
      </div>

      <div className="tokens-container">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Línea</th>
              <th>Columna</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, index) => (
              <tr key={index}>
                <td>
                  <span 
                    className="token-type"
                    style={{ color: getTokenColor(token.type) }}
                  >
                    {token.type}
                  </span>
                </td>
                <td className="token-value">{token.value}</td>
                <td>{token.line}</td>
                <td>{token.column}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {errors && errors.length > 0 && (
        <div className="lexical-errors">
          <h4>Errores Léxicos:</h4>
          {errors.map((error, index) => (
            <div key={index} className="error-item">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokensViewer;