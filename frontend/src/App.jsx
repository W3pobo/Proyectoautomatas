import React, { useState, useRef } from 'react';
import CodeEditor from './components/CodeEditor/CodeEditor';
import ASTVisualizer from './components/ASTVisualizer/ASTVisualizer';
import SymbolTable from './components/SymbolTable/SymbolTable';
import QuadruplesViewer from './components/QuadruplesViewer/QuadruplesViewer';
import OptimizationViewer from './components/OptimizationViewer/OptimizationViewer';
import MetricsDashboard from './components/MetricsDashboard/MetricsDashboard';
import CompilationControls from './components/CompilationControls/CompilationControls';
import TokensViewer from './components/TokensViewer/TokensViewer';
import ObjectCodeViewer from './components/ObjectCodeViewer/ObjectCodeViewer';
import { compileCode } from './services/CompilerApi';
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
  
  // --- 1. MODIFICACIÓN: Añadir estado para el modo paso a paso ---
  const [isStepMode, setIsStepMode] = useState(false);
  
  const [highlightedLine, setHighlightedLine] = useState(null);
  const editorRef = useRef();

  const handleCompile = async () => {
    setLoading(true);
    setError(null);
    setHighlightedLine(null);
    setIsStepMode(false); // <-- 2. MODIFICACIÓN: Desactivar modo paso a paso
    
    try {
      const result = await compileCode(code);
      setCompilationResult(result);
      setActiveTab('tokens');
    } catch (err) {
      setError(err.message || 'Error al compilar el código');
    } finally {
      setLoading(false);
    }
  };

  // --- 3. MODIFICACIÓN: Lógica completa para handleStepByStep ---
  const handleStepByStep = async () => {
    console.log('Iniciando compilación en modo Paso a Paso');
    setLoading(true);
    setError(null);
    setHighlightedLine(null);
    
    try {
      // 3a. Ejecuta la compilación normal para obtener todos los datos
      const result = await compileCode(code);
      setCompilationResult(result);
      
      // 3b. Activa el modo paso a paso
      setIsStepMode(true);
      // 3c. Cambia a la pestaña de cuádruplos
      setActiveTab('quadruples');
      
    } catch (err) {
      setError(err.message || 'Error al compilar el código');
    } finally {
      setLoading(false);
    }
  };
  // --- FIN DE LAS MODIFICACIONES ---


  // (Tus funciones de hover/click para el AST se quedan igual)
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Compilador Web Interactivo</h1>
        <p>Lenguajes y Autómatas II</p>
      </header>

      <div className="app-layout">
        <div className="left-panel">
          <CompilationControls 
            onCompile={handleCompile}
            onStepByStep={handleStepByStep}
            loading={loading}
          />
          
          <CodeEditor 
            ref={editorRef}
            code={code}
            onChange={setCode}
            errors={compilationResult?.errors || []}
            highlightedLine={highlightedLine}
            onLineClick={(line) => {
              console.log("Línea clickeada en editor:", line);
              setHighlightedLine(line);
            }}
          />
        </div>

        <div className="right-panel">
          <div className="tabs">
            <button 
              className={activeTab === 'tokens' ? 'active' : ''}
              onClick={() => setActiveTab('tokens')}
            >
              Tokens
            </button>
            <button 
              className={activeTab === 'ast' ? 'active' : ''}
              onClick={() => setActiveTab('ast')}
            >
              AST
            </button>
            <button 
              className={activeTab === 'symbols' ? 'active' : ''}
              onClick={() => setActiveTab('symbols')}
            >
              Tabla de Símbolos
            </button>
            <button 
              className={activeTab === 'quadruples' ? 'active' : ''}
              onClick={() => setActiveTab('quadruples')}
            >
              Cuádruplos
            </button>
            <button 
              className={activeTab === 'optimization' ? 'active' : ''}
              onClick={() => setActiveTab('optimization')}
            >
              Optimización
            </button>
            <button 
              className={activeTab === 'objectCode' ? 'active' : ''}
              onClick={() => setActiveTab('objectCode')}
            >
              Código Python
            </button>
            <button 
              className={activeTab === 'metrics' ? 'active' : ''}
              onClick={() => setActiveTab('metrics')}
            >
              Métricas
            </button>
          </div>

          <div className="tab-content">
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
                isStepMode={isStepMode} // <-- 4. MODIFICACIÓN: Pasar la prop
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

          {error && (
            <div className="error-message">
              Error: {error}
            </div>
          )}

          {/* Indicador de línea resaltada */}
          {highlightedLine && (
            <div className="highlight-info">
              <span>Línea resaltada: {highlightedLine}</span>
              <button 
                onClick={() => {
                  setHighlightedLine(null);
                  if (editorRef.current && editorRef.current.clearHighlight) {
                    editorRef.current.clearHighlight();
                  }
                }}
                className="clear-highlight-btn"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;