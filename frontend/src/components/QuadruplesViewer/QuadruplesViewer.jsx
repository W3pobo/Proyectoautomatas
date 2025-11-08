import React from 'react';
import './QuadruplesViewer.css';

const QuadruplesViewer = ({ intermediateCode }) => {
    if (!intermediateCode || intermediateCode.length === 0) {
        return (
            <div className="quadruples-visualizer">
                <h3>🔄 Código Intermedio - Cuádruplos</h3>
                <div className="placeholder">
                    <p>Compila un programa para visualizar los Cuádruplos</p>
                </div>
            </div>
        );
    }

    const getOperatorSymbol = (operator, type) => {
        const symbols = {
            'arithmetic': {
                '+': '➕',
                '-': '➖', 
                '*': '✖️',
                '/': '➗'
            },
            'assignment': {
                '=': '🟰'
            },
            'comparison': {
                '>': '>',
                '<': '<',
                '>=': '>=',
                '<=': '<=',
                '==': '==',
                '!=': '!='
            },
            'jump': {
                'if_false': '⤴️',
                '': '↷'
            },
            'label': {
                '': '🏷️'
            },
            'return': {
                '': '↩️'
            },
            'write': {
                '': '🖨️'
            }
        };

        return symbols[type]?.[operator] || operator;
    };

    const getRowClass = (quad) => {
        const baseClass = 'quadruple-row';
        const typeClass = `type-${quad.quadruple_type}`;
        return `${baseClass} ${typeClass}`;
    };

    return (
        <div className="quadruples-visualizer">
            <h3>🔄 Código Intermedio - Cuádruplos</h3>
            
            <div className="quadruples-summary">
                <span className="summary-item">
                    Total: {intermediateCode.length} cuádruplos
                </span>
                <span className="summary-item">
                    Temporales: {intermediateCode.filter(q => q.result?.startsWith('t')).length}
                </span>
                <span className="summary-item">
                    Etiquetas: {intermediateCode.filter(q => q.quadruple_type === 'label').length}
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
                        {intermediateCode.map((quad, index) => (
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
                <h4>Leyenda:</h4>
                <div className="legend-items">
                    <span className="legend-item arithmetic">Aritméticos</span>
                    <span className="legend-item assignment">Asignaciones</span>
                    <span className="legend-item comparison">Comparaciones</span>
                    <span className="legend-item jump">Saltos</span>
                    <span className="legend-item label">Etiquetas</span>
                    <span className="legend-item return">Returns</span>
                    <span className="legend-item write">Print</span>
                </div>
            </div>
        </div>
    );
};

export default QuadruplesViewer;