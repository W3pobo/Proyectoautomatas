import React, { useState } from 'react';
import './ObjectCodeViewer.css';

const ObjectCodeViewer = ({ objectCode }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(objectCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error al copiar:', err);
        }
    };

    if (!objectCode) {
        return (
            <div className="object-code-viewer">
                <h3> Código Objeto (Python)</h3>
                <div className="placeholder">
                    <p>Compila un programa para generar el código Python</p>
                </div>
            </div>
        );
    }

    return (
        <div className="object-code-viewer">
            <div className="header">
                <h3>Código Objeto (Python)</h3>
                <button 
                    className={`copy-button ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                >
                    {copied ? ' Copiado!' : ' Copiar'}
                </button>
            </div>

            <div className="code-container">
                <pre className="python-code">{objectCode}</pre>
            </div>

            <div className="execution-info">
                <h4>Instrucciones de Ejecución:</h4>
                <ol>
                    <li>Guarda el código en un archivo <code>programa.py</code></li>
                    <li>Ejecuta con: <code>python programa.py</code></li>
                    <li>O ejecuta directamente: <code>./programa.py</code> (en Linux/Mac)</li>
                </ol>
            </div>
        </div>
    );
};

export default ObjectCodeViewer;