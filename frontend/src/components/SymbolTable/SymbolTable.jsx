import React, { useState } from 'react';
import './SymbolTable.css';

const SymbolTable = ({ symbolTable }) => {
    const [expandedScopes, setExpandedScopes] = useState(new Set(['global']));

    const toggleScope = (scopeName) => {
        const newExpanded = new Set(expandedScopes);
        if (newExpanded.has(scopeName)) {
            newExpanded.delete(scopeName);
        } else {
            newExpanded.add(scopeName);
        }
        setExpandedScopes(newExpanded);
    };

    const renderSymbolTable = (table, level = 0) => {
        const isExpanded = expandedScopes.has(table.scope_name);
        
        return (
            <div key={table.scope_name} className="symbol-table-level">
                <div 
                    className="scope-header"
                    onClick={() => toggleScope(table.scope_name)}
                    style={{ paddingLeft: level * 20 + 10 }}
                >
                    <span className="toggle-icon">
                        {isExpanded ? '▼' : '►'}
                    </span>
                    <strong>Scope: {table.scope_name}</strong>
                    <span className="scope-badge">Nivel {table.level}</span>
                    <span className="symbol-count">{Object.keys(table.symbols).length} símbolos</span>
                </div>

                {isExpanded && (
                    <div className="scope-content">
                        {Object.keys(table.symbols).length > 0 ? (
                            <table className="symbol-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Tipo</th>
                                        <th>Scope</th>
                                        <th>Línea</th>
                                        <th>Memoria</th>
                                        <th>Inicializada</th>
                                        <th>Usada</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(table.symbols).map((symbol, index) => (
                                        <tr key={index} className={`
                                            ${!symbol.used ? 'unused' : ''}
                                            ${symbol.used && !symbol.initialized ? 'uninitialized' : ''}
                                        `}>
                                            <td>
                                                <span className="symbol-name">{symbol.name}</span>
                                                {symbol.symbol_type === 'function' && ' 🔧'}
                                            </td>
                                            <td>
                                                <span className={`data-type ${symbol.data_type}`}>
                                                    {symbol.data_type}
                                                </span>
                                            </td>
                                            <td>{symbol.scope}</td>
                                            <td>{symbol.line}</td>
                                            <td>#{symbol.memory_address}</td>
                                            <td>
                                                <span className={`status ${symbol.initialized ? 'initialized' : 'not-initialized'}`}>
                                                    {symbol.initialized ? '✅' : '❌'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status ${symbol.used ? 'used' : 'not-used'}`}>
                                                    {symbol.used ? '✅' : '❌'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-scope" style={{ paddingLeft: level * 20 + 30 }}>
                                No hay símbolos en este scope
                            </div>
                        )}

                        {/* Renderizar tablas hijas */}
                        {table.children && table.children.map(childTable => 
                            renderSymbolTable(childTable, level + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!symbolTable) {
        return (
            <div className="symbol-table-visualizer">
                <h3>📊 Tabla de Símbolos</h3>
                <div className="placeholder">
                    <p>Compila un programa para visualizar la Tabla de Símbolos</p>
                </div>
            </div>
        );
    }

    return (
        <div className="symbol-table-visualizer">
            <div className="header">
                <h3>📊 Tabla de Símbolos</h3>
                <div className="summary">
                    <span className="summary-item">
                        Scopes: {countScopes(symbolTable)}
                    </span>
                    <span className="summary-item">
                        Símbolos: {countSymbols(symbolTable)}
                    </span>
                    <span className="summary-item">
                        Variables: {countVariables(symbolTable)}
                    </span>
                    <span className="summary-item">
                        Funciones: {countFunctions(symbolTable)}
                    </span>
                </div>
            </div>
            
            <div className="symbol-table-container">
                {renderSymbolTable(symbolTable)}
            </div>
        </div>
    );
};

// Funciones auxiliares para estadísticas
const countScopes = (table) => {
    let count = 1; // La tabla actual
    table.children?.forEach(child => {
        count += countScopes(child);
    });
    return count;
};

const countSymbols = (table) => {
    let count = Object.keys(table.symbols).length;
    table.children?.forEach(child => {
        count += countSymbols(child);
    });
    return count;
};

const countVariables = (table) => {
    let count = Object.values(table.symbols).filter(s => s.symbol_type === 'variable').length;
    table.children?.forEach(child => {
        count += countVariables(child);
    });
    return count;
};

const countFunctions = (table) => {
    let count = Object.values(table.symbols).filter(s => s.symbol_type === 'function').length;
    table.children?.forEach(child => {
        count += countFunctions(child);
    });
    return count;
};

export default SymbolTable;