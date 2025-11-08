# En: app/api/compile.py

from fastapi import APIRouter, HTTPException
from app.models.schemas import CompileRequest, CompileResponse, SemanticResult
from app.compiler.lexer import Lexer
from app.compiler.parser import Parser
from app.compiler.semantic import SemanticAnalyzer
from app.compiler.intermediate import IntermediateCodeGenerator
from app.compiler.generator import CodeGenerator
from app.compiler.optimizer import CodeOptimizer  # <--- 1. IMPORTAR EL OPTIMIZADOR
import time

router = APIRouter()

@router.post("/compile", response_model=CompileResponse)
async def compile_code(request: CompileRequest):
    start_time = time.time()
    
    print("=== INICIANDO COMPILACIÓN ===")
    print(f"Código recibido:\n{request.code}")
    
    # ... (Tu código de Métricas, Lexer, Parser, y Semantic Analyzer queda igual) ...
    # ... (Lo copio aquí para que sea completo) ...

    # Inicializar métricas
    metrics = {
        "compilation_time": 0, "tokens_count": 0, "ast_nodes_count": 0,
        "symbols_count": 0, "quadruples_count": 0, "temporals_count": 0,
        "errors_count": 0, "warnings_count": 0
    }
    
    # Análisis léxico
    lexer = Lexer()
    tokens, lexer_errors = lexer.tokenize(request.code)
    metrics["tokens_count"] = len(tokens)
    print(f"Tokens generados: {len(tokens)}")
    
    # Análisis sintáctico
    parser = Parser()
    ast, parser_errors = parser.parse(tokens)
    
    if ast:
        def count_nodes(node):
            if not node: return 0
            count = 1
            if node.children:
                for child in node.children: count += count_nodes(child)
            return count
        metrics["ast_nodes_count"] = count_nodes(ast)
        print(f"AST generado exitosamente con {metrics['ast_nodes_count']} nodos")
    
    # Análisis semántico
    semantic_errors = []
    semantic_warnings = []
    symbol_table = None
    
    if ast:
        try:
            semantic_analyzer = SemanticAnalyzer()
            semantic_result = semantic_analyzer.analyze(ast)
            semantic_errors = semantic_result.errors
            semantic_warnings = semantic_result.warnings
            symbol_table = semantic_result.symbol_table
            
            def count_symbols(table):
                if not table: return 0
                count = len(table.symbols)
                for child in table.children: count += count_symbols(child)
                return count
            
            if symbol_table:
                metrics["symbols_count"] = count_symbols(symbol_table)
                print(f"Tabla de símbolos generada con {metrics['symbols_count']} símbolos")
        except Exception as e:
            print(f"Error en análisis semántico: {str(e)}")
            semantic_errors.append(f"Error en análisis semántico: {str(e)}")
            
    # Generación de código intermedio
    intermediate_code = None
    if ast and symbol_table and len(lexer_errors) == 0 and len(parser_errors) == 0 and len(semantic_errors) == 0:
        try:
            code_generator = IntermediateCodeGenerator(symbol_table)
            intermediate_result = code_generator.generate(ast)
            intermediate_code = intermediate_result.quadruples
            metrics["quadruples_count"] = len(intermediate_code)
            metrics["temporals_count"] = intermediate_result.temporal_counter
            print(f"Cuádruplos generados: {len(intermediate_code)}")
        except Exception as e:
            print(f"Error en generación de código intermedio: {str(e)}")
            semantic_errors.append(f"Error en código intermedio: {str(e)}")
            
    # Combinar errores
    all_errors = lexer_errors + parser_errors + semantic_errors
    all_warnings = semantic_warnings
    success = len(all_errors) == 0
    
    # --- 2. AÑADIR EL PASO DE OPTIMIZACIÓN ---
    optimized_code = None
    if intermediate_code and success: # Solo optimizar si no hay errores
        try:
            optimizer = CodeOptimizer()
            optimized_code = optimizer.optimize(intermediate_code)
            print(f"Código optimizado exitosamente: {len(intermediate_code)} -> {len(optimized_code)} cuádruplos")
        except Exception as e:
            print(f"Error en optimización: {str(e)}")
            all_errors.append(f"Error en optimización: {str(e)}")
            success = False
    else:
        print("No se pudo optimizar (pasos previos fallidos)")
    
    # --- 3. MODIFICAR GENERACIÓN DE CÓDIGO OBJETO ---
    object_code = None
    # Decidir qué cuádruplos usar (los optimizados si existen, si no, los originales)
    quads_to_generate = optimized_code if optimized_code is not None else intermediate_code 
    
    if quads_to_generate and symbol_table and success:
        try:
            object_gen = CodeGenerator(symbol_table)
            object_code = object_gen.generate(quads_to_generate)
            print("Código objeto Python generado exitosamente.")
        except Exception as e:
            print(f"Error en generación de código objeto: {str(e)}")
            all_errors.append(f"Error en código objeto: {str(e)}")
            success = False
    else:
        print("No se pudo generar código objeto (pasos previos fallidos)")
    # --- FIN DE LAS MODIFICACIONES ---

    metrics["errors_count"] = len(all_errors)
    metrics["warnings_count"] = len(all_warnings)
    metrics["compilation_time"] = time.time() - start_time
    
    print("=== COMPILACIÓN FINALIZADA ===")
    print(f"Éxito: {success}")
    
    try:
        response = CompileResponse(
            success=success,
            tokens=tokens,
            ast=ast,
            symbol_table=symbol_table,
            intermediate_code=intermediate_code,
            optimized_code=optimized_code, # <-- 4. PASAR EL CÓDIGO OPTIMIZADO
            object_code=object_code,
            errors=all_errors,
            warnings=all_warnings,
            metrics=metrics
        )
        return response
    except Exception as e:
        print(f"Error creando respuesta: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al serializar la respuesta: {e}")