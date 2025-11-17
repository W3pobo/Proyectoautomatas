import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import './ASTVisualizer.css';

const ASTVisualizer = ({ ast, code, onNodeHover, onNodeClick }) => {
  const svgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!ast || !svgRef.current) {
      console.log("No AST or SVG ref available");
      return;
    }

    console.log("Drawing AST:", ast);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Aumentar el tamaño del SVG para mejor espaciado
    const width = 1200;
    const height = 800;
    const margin = { top: 80, right: 200, bottom: 80, left: 200 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Convertir AST a formato D3
    const root = buildTree(ast);
    console.log("D3 Tree structure:", root);
    
    if (!root) {
      console.log("No root node to display");
      return;
    }

    // Configurar el árbol con más separación
    const treeLayout = d3.tree()
      .size([innerHeight, innerWidth])
      .separation((a, b) => {
        // Aumentar la separación entre nodos hermanos
        return (a.parent === b.parent ? 1.5 : 2);
      });

    const rootNode = d3.hierarchy(root);
    treeLayout(rootNode);

    console.log("Tree layout nodes:", rootNode.descendants());

    // Agregar zoom y pan
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Dibujar enlaces con mejor espaciado
    g.append('g')
      .selectAll('line')
      .data(rootNode.links())
      .enter()
      .append('line')
      .attr('x1', d => d.source.y)
      .attr('y1', d => d.source.x)
      .attr('x2', d => d.target.y)
      .attr('y2', d => d.target.x)
      .attr('stroke', '#b0bec5')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,2');

    // Dibujar nodos con más espacio
    const node = g.append('g')
      .selectAll('g')
      .data(rootNode.descendants())
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .attr('class', 'ast-node');

    // Círculos de nodos más grandes y con mejor espaciado
    node.append('circle')
      .attr('r', 35) // Aumentar el radio
      .attr('fill', d => getNodeColor(d.data.type))
      .attr('stroke', d => d.data === selectedNode ? '#FF0000' : '#333')
      .attr('stroke-width', d => d.data === selectedNode ? 4 : 2)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
      .on('mouseover', function(event, d) {
        // Prevenir comportamiento por defecto
        event.preventDefault();
        
        // Resaltar nodo
        d3.select(this)
          .attr('stroke', '#FF6F00')
          .attr('stroke-width', 4)
          .style('filter', 'drop-shadow(0 4px 8px rgba(255, 111, 0, 0.4))');
        
        // Emitir evento de hover
        if (onNodeHover) {
          onNodeHover({
            node: d.data,
            line: d.data.line,
            column: d.data.column
          });
        }
      })
      .on('mouseout', function(event, d) {
        // Prevenir comportamiento por defecto
        event.preventDefault();
        
        // Restaurar apariencia normal (excepto si está seleccionado)
        if (d.data !== selectedNode) {
          d3.select(this)
            .attr('stroke', '#333')
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
        }
        
        // Emitir evento de fin de hover
        if (onNodeHover) {
          onNodeHover(null);
        }
      })
      .on('click', function(event, d) {
        // Prevenir el comportamiento por defecto del navegador
        event.preventDefault();
        event.stopPropagation();
        
        // Seleccionar nodo
        setSelectedNode(d.data);
        d3.select(this)
          .attr('stroke', '#FF0000')
          .attr('stroke-width', 4);
        
        // Emitir evento de click
        if (onNodeClick) {
          onNodeClick({
            node: d.data,
            line: d.data.line,
            column: d.data.column
          });
        }
      });

    // Etiqueta principal del nodo con mejor formato
    node.append('text')
      .text(d => d.data.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', 'white')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)');

    // Valor del nodo (si existe)
    node.append('text')
      .text(d => d.data.value ? `"${truncateText(d.data.value, 15)}"` : '')
      .attr('text-anchor', 'middle')
      .attr('dy', 25)
      .attr('fill', '#2c3e50')
      .style('font-size', '9px')
      .style('font-weight', '500')
      .style('pointer-events', 'none');

    // Información de posición (línea/columna)
    node.append('text')
      .text(d => d.data.line ? `L${d.data.line}:C${d.data.column}` : '')
      .attr('text-anchor', 'middle')
      .attr('dy', 40)
      .attr('fill', '#7f8c8d')
      .style('font-size', '8px')
      .style('pointer-events', 'none');

    // Click en el SVG para deseleccionar
    svg.on('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      if (event.target === this) {
        setSelectedNode(null);
        node.selectAll('circle')
          .attr('stroke', '#333')
          .attr('stroke-width', 2)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
        
        if (onNodeClick) {
          onNodeClick(null);
        }
      }
    });

    // Ajustar la vista inicial
    svg.call(zoom.transform, d3.zoomIdentity.translate(margin.left, margin.top).scale(0.8));

  }, [ast, selectedNode, onNodeHover, onNodeClick]);

  // Función para truncar texto largo
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const buildTree = (node) => {
    if (!node) {
      console.log("buildTree: node is null");
      return null;
    }
    
    console.log("Building tree node:", node.type, node.value, "Line:", node.line);
    
    const treeNode = {
      name: getDisplayName(node.type),
      value: node.value || '',
      type: node.type,
      line: node.line || 0,
      column: node.column || 0,
      children: []
    };

    if (node.children && node.children.length > 0) {
      console.log(`Node ${node.type} has ${node.children.length} children`);
      treeNode.children = node.children
        .map(child => buildTree(child))
        .filter(child => child !== null);
    }

    return treeNode;
  };

  // Función auxiliar para nombres más cortos en la visualización
  const getDisplayName = (type) => {
    const nameMap = {
      'Program': 'Program',
      'FunctionDeclaration': 'Function',
      'Block': 'Block',
      'VariableDeclaration': 'VarDecl',
      'Assignment': 'Assign',
      'IfStatement': 'If',
      'WhileStatement': 'While',
      'BinaryExpression': 'BinaryOp',
      'Identifier': 'Id',
      'Literal': 'Literal',
      'StringLiteral': 'String',
      'ReturnStatement': 'Return',
      'PrintStatement': 'Print',
      'ExpressionStatement': 'ExprStmt'
    };
    return nameMap[type] || type;
  };

  const getNodeColor = (type) => {
    const colors = {
      'Program': '#4CAF50',
      'FunctionDeclaration': '#2196F3',
      'Block': '#FF9800',
      'VariableDeclaration': '#9C27B0',
      'Assignment': '#F44336',
      'IfStatement': '#607D8B',
      'WhileStatement': '#795548',
      'BinaryExpression': '#009688',
      'Identifier': '#FFC107',
      'Literal': '#00BCD4',
      'StringLiteral': '#E91E63',
      'ReturnStatement': '#8BC34A',
      'PrintStatement': '#FF5722',
      'ExpressionStatement': '#795548'
    };
    return colors[type] || '#607D8B';
  };

  if (!ast) {
    return (
      <div className="ast-visualizer">
        <h3>Árbol de Sintaxis Abstracta (AST)</h3>
        <div className="placeholder">
          <p>Compila un programa para visualizar el Árbol de Sintaxis Abstracta</p>
        </div>
      </div>
    );
  } 

  return (
    <div className="ast-visualizer">
      <h3>Árbol de Sintaxis Abstracta (AST)</h3>
      <div className="interactive-info">
        {selectedNode ? (
          <div className="node-info">
            <strong>Nodo seleccionado:</strong> {selectedNode.name} 
            {selectedNode.value && ` (${selectedNode.value})`}
            {selectedNode.line > 0 && ` - Línea ${selectedNode.line}, Columna ${selectedNode.column}`}
          </div>
        ) : (
          <div className="node-info">
            <em> Pasa el cursor sobre los nodos para resaltar el código |  Haz click para seleccionar |  Usa la rueda del mouse para hacer zoom</em>
          </div>
        )}
        {zoomLevel !== 1 && (
          <div style={{marginTop: '5px', fontSize: '12px'}}>
            Zoom: {(zoomLevel * 100).toFixed(0)}%
          </div>
        )}
      </div>
      <div className="visualization-container">
        <svg 
          ref={svgRef}
          style={{ outline: 'none' }}
          tabIndex="-1" // Prevenir que el SVG reciba focus
        ></svg>
      </div>
      <div className="ast-raw">
        <details>
          <summary>Ver AST en formato JSON (Para debugging)</summary>
          <pre>{JSON.stringify(ast, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
};

export default ASTVisualizer;