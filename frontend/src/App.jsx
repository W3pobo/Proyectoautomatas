import React, { useState } from 'react';
import CodeEditor from './components/CodeEditor/CodeEditor';
import ASTVisualizer from './components/ASTVisualizer/ASTVisualizer';
import SymbolTable from './components/SymbolTable/SymbolTable';
import QuadruplesViewer from './components/QuadruplesViewer/QuadruplesViewer';
import OptimizationViewer from './components/OptimizationViewer/OptimizationViewer';
import MetricsDashboard from './components/MetricsDashboard/MetricsDashboard';
import CompilationControls from './components/CompilationControls/CompilationControls';
import TokensViewer from './components/TokensViewer/TokensViewer';
import ObjectCodeViewer from './components/ObjectCodeViewer/ObjectCodeViewer'; // ← NUEVO
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

  const handleCompile = async () => {
    setLoading(true);
    setError(null);
    
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

  const handleStepByStep = () => {
    console.log('Compilación paso a paso');
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
            code={code}
            onChange={setCode}
            errors={compilationResult?.errors || []}
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
              className={activeTab === 'objectCode' ? 'active' : ''} // ← NUEVA PESTAÑA
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
              />
            )}
            
            {activeTab === 'symbols' && (
              <SymbolTable 
                symbolTable={compilationResult?.symbol_table}
              />
            )}
            
            {activeTab === 'quadruples' && (
              <QuadruplesViewer 
                intermediateCode={compilationResult?.intermediate_code} // <-- ¡CORREGIDO!
                optimizedQuadruples={compilationResult?.optimized_code}
              />
            )}
            
            {activeTab === 'optimization' && (
              <OptimizationViewer 
                original={compilationResult?.intermediate_code}
                optimized={compilationResult?.optimized_code}
              />
            )}
            
            {activeTab === 'objectCode' && ( // ← NUEVO COMPONENTE
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
        </div>
      </div>
    </div>
  );
}

export default App;