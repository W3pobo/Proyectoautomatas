import React, { useEffect, useRef } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { lintGutter, linter } from '@codemirror/lint';
import { defaultKeymap } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import './EnhancedCodeEditor.css';

const EnhancedCodeEditor = ({ 
  code, 
  onChange, 
  errors = [], 
  highlightedLine = null,
  onLineClick,
  customLinter 
}) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);

  // Configurar el linter personalizado
  const customLinterExtension = linter((view) => {
    const diagnostics = [];
    
    // Convertir errores del backend a diagnósticos de CodeMirror
    errors.forEach((error, index) => {
      const lineMatch = error.match(/línea\s+(\d+)/i);
      if (lineMatch) {
        const lineNumber = parseInt(lineMatch[1]) - 1; // CodeMirror usa base 0
        const line = view.state.doc.line(lineNumber + 1);
        
        diagnostics.push({
          from: line.from,
          to: line.to,
          severity: 'error',
          message: error,
          source: 'compiler'
        });
      }
    });
    
    return diagnostics;
  });

  useEffect(() => {
    if (!editorRef.current) return;

    // Extensiones de CodeMirror
    const extensions = [
      keymap.of(defaultKeymap),
      oneDark,
      javascript(),
      lintGutter(),
      customLinterExtension,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newCode = update.state.doc.toString();
          onChange(newCode);
        }
      }),
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "14px"
        },
        ".cm-gutters": {
          backgroundColor: "var(--editor-gutter-bg)",
          color: "var(--editor-gutter-color)",
          border: "none"
        },
        ".cm-activeLine": {
          backgroundColor: "var(--editor-active-line)"
        },
        ".cm-activeLineGutter": {
          backgroundColor: "var(--editor-active-line-gutter)"
        }
      })
    ];

    // Crear el editor
    const state = EditorState.create({
      doc: code,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Actualizar contenido cuando cambia el código
  useEffect(() => {
    if (viewRef.current && code !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: code
        }
      });
    }
  }, [code]);

  // Resaltar línea específica
  useEffect(() => {
    if (viewRef.current && highlightedLine !== null) {
      const line = viewRef.current.state.doc.line(highlightedLine);
      viewRef.current.dispatch({
        effects: EditorView.dispatchFocus.of(),
        selection: { anchor: line.from }
      });
    }
  }, [highlightedLine]);

  return (
    <div className="enhanced-code-editor">
      <div className="editor-header">
        <h3>Editor de Código Avanzado</h3>
        <div className="editor-info">
          {errors.length > 0 && (
            <span className="error-count">
              {errors.length} error(es) encontrado(s)
            </span>
          )}
          {highlightedLine && (
            <span className="line-highlight-info">
              Línea {highlightedLine} resaltada
            </span>
          )}
        </div>
      </div>
      
      <div ref={editorRef} className="cm-editor-container" />
      
      {errors.length > 0 && (
        <div className="errors-summary">
          <h4>Errores de Compilación:</h4>
          <div className="errors-list">
            {errors.map((error, index) => (
              <div key={index} className="error-item">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCodeEditor;