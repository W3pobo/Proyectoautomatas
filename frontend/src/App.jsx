import React, { useState, useRef, useCallback, useEffect } from 'react';
import EnhancedCodeEditor from './components/CodeEditor/EnhancedCodeEditor';
import ASTVisualizer from './components/ASTVisualizer/ASTVisualizer';
import SymbolTable from './components/SymbolTable/SymbolTable';
import QuadruplesViewer from './components/QuadruplesViewer/QuadruplesViewer';
import OptimizationViewer from './components/OptimizationViewer/OptimizationViewer';
import MetricsDashboard from './components/MetricsDashboard/MetricsDashboard';
import CompilationControls from './components/CompilationControls/CompilationControls';
import TokensViewer from './components/TokensViewer/TokensViewer';
import ObjectCodeViewer from './components/ObjectCodeViewer/ObjectCodeViewer';
import { compileCode, lintCode } from './services/CompilerApi';
import './styles/App.css';

function App() {
  const [code, setCode] = useState(`// Escribe tu código aquí
function main() {
    int x = 10;
    int y = 5;
    int result = x + y * 2;

    if (result > 15) {
        print("Resultado mayor a 15");
    } else {
        print("Resultado menor o igual a 15");
    }

    return 0;
}`);
  
  const [compilationResult, setCompilationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [lintErrors, setLintErrors] = useState([]);
  const [isStepMode, setIsStepMode] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const editorRef = useRef();
  const lintTimeoutRef = useRef();

  // Función de linting con debouncing
  const performLinting = useCallback(async (sourceCode) => {
    if (lintTimeoutRef.current) {
      clearTimeout(lintTimeoutRef.current);
    }

    lintTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('🔍 Realizando linting en tiempo real...');
        const lintResult = await lintCode(sourceCode);
        setLintErrors(lintResult.errors);
        console.log(`📋 Linting: ${lintResult.errors.length} errores encontrados`);
      } catch (err) {
        console.warn('No se pudo realizar linting:', err.message);
      }
    }, 1000);
  }, []);

  // Efecto para linting en tiempo real
  useEffect(() => {
    if (code.trim().length > 0) {
      performLinting(code);
    } else {
      setLintErrors([]);
    }

    return () => {
      if (lintTimeoutRef.current) {
        clearTimeout(lintTimeoutRef.current);
      }
    };
  }, [code, performLinting]);

  const handleCompile = async () => {
    setLoading(true);
    setError(null);
    setHighlightedLine(null);
    setIsStepMode(false);
    
    try {
      const result = await compileCode(code);
      setCompilationResult(result);
      setLintErrors(result.errors || []);
      setActiveTab('tokens');
    } catch (err) {
      setError(err.message || 'Error al compilar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleStepByStep = async () => {
    console.log('Iniciando compilación en modo Paso a Paso');
    setLoading(true);
    setError(null);
    setHighlightedLine(null);
    
    try {
      const result = await compileCode(code);
      setCompilationResult(result);
      setLintErrors(result.errors || []);
      setIsStepMode(true);
      setActiveTab('quadruples');
    } catch (err) {
      setError(err.message || 'Error al compilar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleAstNodeHover = (nodeInfo) => {
    if (nodeInfo && nodeInfo.line > 0) {
      setHighlightedLine(nodeInfo.line);
      if (editorRef.current && editorRef.current.highlightLine) {
        editorRef.current.highlightLine(nodeInfo.line);
      }
    } else {
      setHighlightedLine(null);
      if (editorRef.current && editorRef.current.clearHighlight) {
        editorRef.current.clearHighlight();
      }
    }
  };

  const handleAstNodeClick = (nodeInfo) => {
    if (nodeInfo && nodeInfo.line > 0) {
      setHighlightedLine(nodeInfo.line);
      if (editorRef.current && editorRef.current.gotoLine) {
        editorRef.current.gotoLine(nodeInfo.line, nodeInfo.column || 0);
      }
      setActiveTab('editor');
    }
  };

  const handleClearHighlight = () => {
    setHighlightedLine(null);
    if (editorRef.current && editorRef.current.clearHighlight) {
      editorRef.current.clearHighlight();
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  
  const quickNavItems = [
    { id: 'tokens',label: 'Tokens', color: '#4CAF50' },
    { id: 'ast', label: 'AST', color: '#FF9800' },
    { id: 'symbols', label: 'Símbolos', color: '#2196F3' },
    { id: 'quadruples', label: 'Cuádruplos', color: '#9C27B0' },
    { id: 'optimization', label: 'Optimización', color: '#009688' },
    { id: 'objectCode',label: 'Python', color: '#FF5722' },
    { id: 'metrics', label: 'Métricas', color: '#795548' }
  ];

  return (
    <div className="app">
      {/* Header Superior */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">⚡</span>
              <h1>Compilador Interactivo</h1>
            </div>
            <p>Lenguajes y Autómatas II - ITI</p>
          </div>
          <div className="header-right">
            <div className="status-indicators">
              {lintErrors.length > 0 && (
                <span className="error-indicator">
                  ⚠️ {lintErrors.length} error(es)
                </span>
              )}
              {loading && (
                <span className="loading-indicator">
                  🔄 Compilando...
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="app-main">
        {/* Sidebar de Navegación Rápida */}
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarCollapsed ? '➡️' : '⬅️'}
          </button>
          
          <nav className="quick-nav">
            {quickNavItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                style={{ '--accent-color': item.color }}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="nav-label">{item.label}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Información de compilación */}
          {!sidebarCollapsed && compilationResult && (
            <div className="compilation-info-sidebar">
              <h4>Última Compilación</h4>
              <div className="compilation-stats">
                <div className="stat">
                  <span className="stat-value">{compilationResult.metrics?.tokens_count || 0}</span>
                  <span className="stat-label">Tokens</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{compilationResult.metrics?.errors_count || 0}</span>
                  <span className="stat-label">Errores</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {(compilationResult.metrics?.compilation_time * 1000).toFixed(2)}ms
                  </span>
                  <span className="stat-label">Tiempo</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Área Principal de Trabajo */}
        <main className="main-content">
          {/* Barra de Herramientas Superior */}
          <div className="toolbar">
            <CompilationControls 
              onCompile={handleCompile}
              onStepByStep={handleStepByStep}
              loading={loading}
              lintErrorCount={lintErrors.length}
            />
            
            <div className="view-controls">
              <button 
                className={`view-btn ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                 Vista Editor
              </button>
              <button 
                className={`view-btn ${activeTab !== 'editor' ? 'active' : ''}`}
                onClick={() => activeTab === 'editor' && setActiveTab('tokens')}
              >
                 Vista Resultados
              </button>
            </div>
          </div>

          {/* Contenido Dinámico */}
          <div className="content-area">
            {activeTab === 'editor' ? (
              /* Vista Editor (Pantalla Completa) */
              <div className="editor-fullview">
                <EnhancedCodeEditor 
                  ref={editorRef}
                  code={code}
                  onChange={setCode}
                  errors={lintErrors}
                  highlightedLine={highlightedLine}
                  onLineClick={(line) => {
                    console.log("Línea clickeada en editor:", line);
                    setHighlightedLine(line);
                  }}
                />
              </div>
            ) : (
              /* Vista de Resultados (Split Screen) */
              <div className="results-splitview">
                <div className="results-sidebar">
                  <div className="results-tabs">
                    {quickNavItems.slice(0, 4).map(item => (
                      <button
                        key={item.id}
                        className={`results-tab ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                      >
                        <span className="tab-icon">{item.icon}</span>
                        <span className="tab-label">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="results-main">
                  <div className="results-content">
                    {activeTab === 'tokens' && (
                      <TokensViewer 
                        tokens={compilationResult?.tokens}
                        errors={compilationResult?.errors}
                      />
                    )}
                    
                    {activeTab === 'ast' && (
                      <ASTVisualizer 
                        ast={compilationResult?.ast}
                        code={code}
                        onNodeHover={handleAstNodeHover}
                        onNodeClick={handleAstNodeClick}
                      />
                    )}
                    
                    {activeTab === 'symbols' && (
                      <SymbolTable 
                        symbolTable={compilationResult?.symbol_table}
                      />
                    )}
                    
                    {activeTab === 'quadruples' && (
                      <QuadruplesViewer 
                        intermediateCode={compilationResult?.intermediate_code}
                        optimizedQuadruples={compilationResult?.optimized_code}
                        isStepMode={isStepMode}
                      />
                    )}
                    
                    {activeTab === 'optimization' && (
                      <OptimizationViewer 
                        original={compilationResult?.intermediate_code}
                        optimized={compilationResult?.optimized_code}
                      />
                    )}
                    
                    {activeTab === 'objectCode' && (
                      <ObjectCodeViewer 
                        objectCode={compilationResult?.object_code}
                      />
                    )}
                    
                    {activeTab === 'metrics' && (
                      <MetricsDashboard 
                        metrics={compilationResult?.metrics}
                      />
                    )}
                  </div>
                </div>

                <div className="results-sidebar right">
                  <div className="results-tabs">
                    {quickNavItems.slice(4).map(item => (
                      <button
                        key={item.id}
                        className={`results-tab ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                      >
                        <span className="tab-icon">{item.icon}</span>
                        <span className="tab-label">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel de Estado Inferior */}
          <footer className="status-bar">
            <div className="status-left">
              {highlightedLine && (
                <div className="highlight-info">
                  <span>📌 Línea {highlightedLine} resaltada</span>
                  <button 
                    onClick={handleClearHighlight}
                    className="clear-highlight-btn"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            
            <div className="status-center">
              {compilationResult && (
                <span className="compilation-status">
                  ✅ Compilación {compilationResult.success ? 'exitosa' : 'fallida'}
                </span>
              )}
            </div>
            
            <div className="status-right">
              <span className="cursor-info">
                Línea: {code.split('\n').length} | Caracteres: {code.length}
              </span>
            </div>
          </footer>

          {/* Mensaje de Error Global */}
          {error && (
            <div className="error-overlay">
              <div className="error-message">
                <div className="error-header">
                  <span className="error-icon">❌</span>
                  <strong>Error de Compilación</strong>
                  <button 
                    className="close-error"
                    onClick={() => setError(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="error-content">{error}</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;