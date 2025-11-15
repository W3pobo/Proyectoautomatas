import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import './ASTVisualizer.css';

const ASTVisualizer = ({ ast, code, onNodeHover, onNodeClick }) => {
  const svgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!ast || !svgRef.current) {
      console.log("No AST or SVG ref available");
      return;
    }

    console.log("Drawing AST:", ast);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    const margin = { top: 50, right: 120, bottom: 50, left: 120 };
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

    const treeLayout = d3.tree().size([innerHeight, innerWidth]);
    const rootNode = d3.hierarchy(root);
    treeLayout(rootNode);

    console.log("Tree layout nodes:", rootNode.descendants());

    // Dibujar enlaces
    g.append('g')
      .selectAll('line')
      .data(rootNode.links())
      .enter()
      .append('line')
      .attr('x1', d => d.source.y)
      .attr('y1', d => d.source.x)
      .attr('x2', d => d.target.y)
      .attr('y2', d => d.target.x)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2);

    // Dibujar nodos
    const node = g.append('g')
      .selectAll('g')
      .data(rootNode.descendants())
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    // Círculos de nodos con interactividad
    node.append('circle')
      .attr('r', 25)
      .attr('fill', d => getNodeColor(d.data.type))
      .attr('stroke', d => d.data === selectedNode ? '#FF0000' : '#333')
      .attr('stroke-width', d => d.data === selectedNode ? 3 : 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        // Resaltar nodo
        d3.select(this)
          .attr('stroke', '#FF0000')
          .attr('stroke-width', 3);
        
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
        // Restaurar apariencia normal (excepto si está seleccionado)
        if (d.data !== selectedNode) {
          d3.select(this)
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
        }
        
        // Emitir evento de fin de hover
        if (onNodeHover) {
          onNodeHover(null);
        }
      })
      .on('click', function(event, d) {
        // Seleccionar nodo
        setSelectedNode(d.data);
        d3.select(this)
          .attr('stroke', '#FF0000')
          .attr('stroke-width', 3);
        
        // Emitir evento de click
        if (onNodeClick) {
          onNodeClick({
            node: d.data,
            line: d.data.line,
            column: d.data.column
          });
        }
        
        event.stopPropagation();
      });

    // Etiqueta principal del nodo
    node.append('text')
      .text(d => d.data.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', 'white')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none');

    // Valor del nodo (si existe)
    node.append('text')
      .text(d => d.data.value ? `"${d.data.value}"` : '')
      .attr('text-anchor', 'middle')
      .attr('dy', 20)
      .attr('fill', '#333')
      .style('font-size', '8px')
      .style('pointer-events', 'none');

    // Información de posición (línea/columna)
    node.append('text')
      .text(d => d.data.line ? `L${d.data.line}:C${d.data.column}` : '')
      .attr('text-anchor', 'middle')
      .attr('dy', 35)
      .attr('fill', '#666')
      .style('font-size', '7px')
      .style('pointer-events', 'none');

    // Click en el SVG para deseleccionar
    svg.on('click', function(event) {
      if (event.target === this) {
        setSelectedNode(null);
        node.selectAll('circle')
          .attr('stroke', '#333')
          .attr('stroke-width', 1);
        
        if (onNodeClick) {
          onNodeClick(null);
        }
      }
    });

  }, [ast, selectedNode, onNodeHover, onNodeClick]);

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
            <em>Pasa el cursor sobre los nodos para resaltar el código correspondiente</em>
          </div>
        )}
      </div>
      <div className="visualization-container">
        <svg ref={svgRef}></svg>
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