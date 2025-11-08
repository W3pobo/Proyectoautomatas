from app.models.schemas import (
    ASTNode, Quadruple, IntermediateCode, QuadrupleType, 
    SymbolTable, Symbol, SymbolType, DataType
)
from typing import List, Optional, Dict, Tuple
import uuid

class IntermediateCodeGenerator:
    def __init__(self, symbol_table: SymbolTable):
        self.symbol_table = symbol_table
        self.quadruples: List[Quadruple] = []
        self.temporal_counter = 0
        self.label_counter = 0
        self.current_scope = "global"
        self.scope_stack = [symbol_table]
        
        # Pila para manejo de expresiones
        self.operand_stack: List[Tuple[str, DataType]] = []
        self.operator_stack: List[str] = []
        self.jump_stack: List[int] = []
    
    def generate(self, ast: ASTNode) -> IntermediateCode:
        """Genera código intermedio a partir del AST"""
        print("=== GENERANDO CÓDIGO INTERMEDIO ===")
        
        if not ast:
            return IntermediateCode()
        
        self.visit_node(ast)
        
        print(f"=== GENERACIÓN COMPLETADA ===")
        print(f"Cuádruplos generados: {len(self.quadruples)}")
        print(f"Temporales usados: {self.temporal_counter}")
        
        return IntermediateCode(
            quadruples=self.quadruples,
            temporal_counter=self.temporal_counter,
            label_counter=self.label_counter
        )
    
    def visit_node(self, node: ASTNode) -> Optional[str]:
        """Visita un nodo del AST y genera cuádruplos"""
        if not node:
            return None
            
        method_name = f'visit_{node.type.lower()}'
        visitor = getattr(self, method_name, self.visit_default)
        return visitor(node)
    
    def visit_default(self, node: ASTNode) -> Optional[str]:
        """Visitante por defecto"""
        if node.children:
            for child in node.children:
                self.visit_node(child)
        return None
    
    def visit_program(self, node: ASTNode) -> Optional[str]:
        """Visita el programa principal"""
        if node.children:
            for child in node.children:
                self.visit_node(child)
        return None
    
    def visit_functiondeclaration(self, node: ASTNode) -> Optional[str]:
        """Visita declaración de función"""
        function_name = node.value
        
        # Generar etiqueta para la función
        func_label = f"func_{function_name}"
        self.add_quadruple(QuadrupleType.LABEL, result=func_label)
        
        # Procesar cuerpo de la función
        if node.children:
            self.visit_node(node.children[0])  # Block
        
        # Si es la función main, agregar return implícito
        if function_name == "main":
            self.add_quadruple(QuadrupleType.RETURN, result="0")
        
        return None
    
    def visit_block(self, node: ASTNode) -> Optional[str]:
        """Visita un bloque de código"""
        if node.children:
            for child in node.children:
                self.visit_node(child)
        return None
    
    def visit_variabledeclaration(self, node: ASTNode) -> Optional[str]:
        """Visita declaración de variable"""
        if not node.children:
            return None
        
        variable_name = node.children[0].value
        
        # Si hay inicialización, generar cuádruplo de asignación
        if len(node.children) > 1 and node.children[1].type != "Empty":
            # Evaluar la expresión de inicialización
            expr_result = self.visit_node(node.children[1])
            if expr_result:
                self.add_quadruple(
                    QuadrupleType.ASSIGNMENT,
                    arg1=expr_result,
                    result=variable_name
                )
                print(f"📝 Asignación inicial: {variable_name} = {expr_result}")
        
        return None
    
    def visit_assignment(self, node: ASTNode) -> Optional[str]:
        """Visita asignación de variable"""
        if not node.children:
            return None
        
        variable_name = node.children[0].value
        
        # Evaluar la expresión del lado derecho
        if len(node.children) > 1:
            expr_result = self.visit_node(node.children[1])
            if expr_result:
                self.add_quadruple(
                    QuadrupleType.ASSIGNMENT,
                    arg1=expr_result,
                    result=variable_name
                )
                print(f"🔄 Asignación: {variable_name} = {expr_result}")
                return variable_name
        
        return None
    
    def visit_binaryexpression(self, node: ASTNode) -> Optional[str]:
        """Visita expresión binaria y genera cuádruplos aritméticos"""
        if not node.children or len(node.children) < 2:
            return None
        
        # Evaluar operandos
        left_operand = self.visit_node(node.children[0])
        right_operand = self.visit_node(node.children[1])
        operator = node.value
        
        if left_operand and right_operand:
            # Crear temporal para el resultado
            temp_var = self.new_temporal()
            
            # Determinar el tipo de operación
            if operator in ['+', '-', '*', '/']:
                quad_type = QuadrupleType.ARITHMETIC
            elif operator in ['>', '<', '>=', '<=', '==', '!=']:
                quad_type = QuadrupleType.COMPARISON
            else:
                quad_type = QuadrupleType.ARITHMETIC
            
            # Generar cuádruplo
            self.add_quadruple(
                quad_type,
                operator=operator,
                arg1=left_operand,
                arg2=right_operand,
                result=temp_var
            )
            
            print(f"🔢 Expresión: {left_operand} {operator} {right_operand} -> {temp_var}")
            return temp_var
        
        return None
    
    def visit_identifier(self, node: ASTNode) -> Optional[str]:
        """Visita identificador (variable)"""
        return node.value
    
    def visit_literal(self, node: ASTNode) -> Optional[str]:
        """Visita literal (número)"""
        return node.value
    
    def visit_stringliteral(self, node: ASTNode) -> Optional[str]:
        """Visita string literal"""
        return f'"{node.value}"'
    
    def visit_ifstatement(self, node: ASTNode) -> Optional[str]:
        """Visita sentencia if y genera saltos condicionales"""
        if not node.children or len(node.children) < 2:
            return None
        
        # 1. Evaluar condición
        condition_result = self.visit_node(node.children[0])
        
        if condition_result:
            # 2. Generar salto condicional (si falso, saltar al else/end)
            false_label = self.new_label("else")
            self.add_quadruple(
                QuadrupleType.JUMP,
                operator="if_false",
                arg1=condition_result,
                result=false_label
            )
            
            # 3. Código del bloque then
            self.visit_node(node.children[1])
            
            # 4. Si hay else, salto al final
            end_label = None
            if len(node.children) > 2:
                end_label = self.new_label("end_if")
                self.add_quadruple(
                    QuadrupleType.JUMP,
                    result=end_label
                )
            
            # 5. Etiqueta else
            self.add_quadruple(QuadrupleType.LABEL, result=false_label)
            
            # 6. Código del bloque else (si existe)
            if len(node.children) > 2:
                self.visit_node(node.children[2])
                # 7. Etiqueta end
                self.add_quadruple(QuadrupleType.LABEL, result=end_label)
            else:
                # Si no hay else, false_label es el end
                pass
        
        return None
    
    def visit_whilestatement(self, node: ASTNode) -> Optional[str]:
        """Visita sentencia while y genera loop con saltos"""
        if not node.children or len(node.children) < 2:
            return None
        
        # 1. Etiqueta de inicio del loop
        start_label = self.new_label("while_start")
        self.add_quadruple(QuadrupleType.LABEL, result=start_label)
        
        # 2. Evaluar condición
        condition_result = self.visit_node(node.children[0])
        
        if condition_result:
            # 3. Salto condicional (si falso, salir del loop)
            end_label = self.new_label("while_end")
            self.add_quadruple(
                QuadrupleType.JUMP,
                operator="if_false",
                arg1=condition_result,
                result=end_label
            )
            
            # 4. Código del cuerpo del while
            self.visit_node(node.children[1])
            
            # 5. Salto al inicio del loop
            self.add_quadruple(
                QuadrupleType.JUMP,
                result=start_label
            )
            
            # 6. Etiqueta de fin del loop
            self.add_quadruple(QuadrupleType.LABEL, result=end_label)
        
        return None
    
    def visit_returnstatement(self, node: ASTNode) -> Optional[str]:
        """Visita sentencia return"""
        return_value = None
        
        if node.children:
            return_value = self.visit_node(node.children[0])
        
        self.add_quadruple(
            QuadrupleType.RETURN,
            arg1=return_value or "0"
        )
        
        print(f"↩️ Return: {return_value}")
        return None
    
    def visit_printstatement(self, node: ASTNode) -> Optional[str]:
        """Visita sentencia print"""
        if node.children:
            expr_result = self.visit_node(node.children[0])
            if expr_result:
                self.add_quadruple(
                    QuadrupleType.WRITE,
                    arg1=expr_result
                )
                print(f"🖨️ Print: {expr_result}")
        
        return None
    
    def add_quadruple(self, 
                     quad_type: QuadrupleType, 
                     operator: str = "",
                     arg1: Optional[str] = None,
                     arg2: Optional[str] = None,
                     result: Optional[str] = None):
        """Agrega un cuádruplo a la lista"""
        quadruple = Quadruple(
            index=len(self.quadruples),
            operator=operator,
            arg1=arg1,
            arg2=arg2,
            result=result,
            quadruple_type=quad_type
        )
        self.quadruples.append(quadruple)
        
        # Debug del cuádruplo generado
        self.print_quadruple(quadruple)
    
    def print_quadruple(self, quad: Quadruple):
        """Imprime un cuádruplo de forma legible"""
        index_str = f"{quad.index:3d}"
        op_str = f"{quad.operator:10}" if quad.operator else " " * 10
        arg1_str = f"{quad.arg1:8}" if quad.arg1 else " " * 8
        arg2_str = f"{quad.arg2:8}" if quad.arg2 else " " * 8
        result_str = f"{quad.result:8}" if quad.result else " " * 8
        
        print(f"🎯 [{index_str}] {op_str} {arg1_str} {arg2_str} {result_str}")
    
    def new_temporal(self) -> str:
        """Genera un nuevo temporal"""
        temp_name = f"t{self.temporal_counter}"
        self.temporal_counter += 1
        return temp_name
    
    def new_label(self, prefix: str) -> str:
        """Genera una nueva etiqueta"""
        label_name = f"{prefix}_{self.label_counter}"
        self.label_counter += 1
        return label_name
    
    def get_quadruples_display(self) -> List[Dict]:
        """Retorna los cuádruplos en formato para visualización"""
        display_list = []
        for quad in self.quadruples:
            display_list.append({
                "index": quad.index,
                "operator": quad.operator,
                "arg1": quad.arg1,
                "arg2": quad.arg2,
                "result": quad.result,
                "type": quad.quadruple_type.value
            })
        return display_list