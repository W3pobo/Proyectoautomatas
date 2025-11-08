from app.models.schemas import Quadruple, QuadrupleType, SymbolTable
from typing import List, Dict, Tuple

class CodeGenerator:
    def __init__(self, symbol_table: SymbolTable):
        self.symbol_table = symbol_table
        self.generated_code = []
        self.indent_level = 0
        self.temp_vars = set()
        
    def generate(self, quadruples: List[Quadruple]) -> str:
        """Genera código Python a partir de los cuádruplos"""
        print("=== GENERANDO CÓDIGO OBJETO (Python) ===")
        
        if not quadruples:
            return "# No se pudo generar código\n"
        
        self.generated_code = []
        
        # Generar encabezado del programa
        self.add_line("#!/usr/bin/env python3")
        self.add_line("# Código generado automáticamente por el compilador")
        self.add_line("")
        
        # Generar declaraciones de variables globales
        self.generate_variable_declarations()
        self.add_line("")
        
        # Generar las funciones
        self.generate_functions(quadruples)
        
        # Generar llamada principal si existe main
        self.add_line("if __name__ == \"__main__\":")
        self.indent_level += 1
        self.add_line("main()")
        self.indent_level -= 1
        
        code_str = "\n".join(self.generated_code)
        
        print("=== GENERACIÓN DE CÓDIGO COMPLETADA ===")
        print(f"Líneas de código generadas: {len(self.generated_code)}")
        
        return code_str
    
    def generate_variable_declarations(self):
        """Genera declaraciones de variables globales"""
        global_vars = []
        
        def collect_vars(table):
            for symbol in table.symbols.values():
                if symbol.symbol_type == "variable" and symbol.scope == "global":
                    global_vars.append(symbol.name)
            for child in table.children:
                collect_vars(child)
        
        collect_vars(self.symbol_table)
        
        if global_vars:
            self.add_line("# Variables globales")
            for var in global_vars:
                self.add_line(f"{var} = None")
    
    def generate_functions(self, quadruples: List[Quadruple]):
        """Genera las funciones a partir de los cuádruplos"""
        current_function = None
        function_quads = []
        
        for quad in quadruples:
            
            # --- INICIO DE LA CORRECCIÓN ---
            if (quad.quadruple_type == QuadrupleType.LABEL and 
                quad.result.startswith("func_")): # <-- CORREGIDO (usa result)
                
                # Procesar función anterior si existe
                if current_function:
                    self.generate_function_code(current_function, function_quads)
                    self.indent_level -= 1 # Salir del scope de la función anterior
                    self.add_line("")
                    function_quads = []
                
                current_function = quad.result.replace("func_", "") # <-- CORREGIDO (usa result)
                self.add_line(f"def {current_function}():")
                self.indent_level += 1
                
                # Inicializar variables locales
                self.generate_local_variables(current_function)
            
            # --- FIN DE LA CORRECCIÓN ---
            
            elif current_function:
                function_quads.append(quad)
        
        # Procesar la última función
        if current_function:
            self.generate_function_code(current_function, function_quads)
            self.indent_level -= 1
            self.add_line("")
    
    def generate_local_variables(self, function_name: str):
        """Genera inicialización de variables locales"""
        local_vars = []
        
        def find_local_vars(table):
            for symbol in table.symbols.values():
                if (symbol.symbol_type == "variable" and 
                    symbol.scope == function_name):
                    local_vars.append(symbol.name)
            for child in table.children:
                find_local_vars(child)
        
        find_local_vars(self.symbol_table)
        
        for var in local_vars:
            self.add_line(f"{var} = None")
    
    def generate_function_code(self, function_name: str, quads: List[Quadruple]):
        """Genera el código de una función específica"""
        label_map = self.build_label_map(quads)
        i = 0
        
        while i < len(quads):
            quad = quads[i]
            
            # Mapear etiquetas
            if quad.result in label_map:
                self.add_line(f"# {quad.result}")
            
            # Generar código según el tipo de cuádruplo
            if quad.quadruple_type == QuadrupleType.ASSIGNMENT:
                self.generate_assignment(quad)
            
            elif quad.quadruple_type == QuadrupleType.ARITHMETIC:
                self.generate_arithmetic(quad)
            
            elif quad.quadruple_type == QuadrupleType.COMPARISON:
                self.generate_comparison(quad)
            
            elif quad.quadruple_type == QuadrupleType.JUMP:
                i = self.generate_jump(quad, quads, i, label_map)
                continue  # Saltar incremento normal
            
            elif quad.quadruple_type == QuadrupleType.WRITE:
                self.generate_write(quad)
            
            elif quad.quadruple_type == QuadrupleType.RETURN:
                self.generate_return(quad)
                break  # Return termina la función
            
            i += 1
        
        # Si no hay return explícito, agregar uno implícito
        if not any(q.quadruple_type == QuadrupleType.RETURN for q in quads):
            self.add_line("return None")
    
    def generate_assignment(self, quad: Quadruple):
        """Genera código para asignación"""
        rhs = self.format_operand(quad.arg1)
        self.add_line(f"{quad.result} = {rhs}")
    
    def generate_arithmetic(self, quad: Quadruple):
        """Genera código para operaciones aritméticas"""
        op1 = self.format_operand(quad.arg1)
        op2 = self.format_operand(quad.arg2)
        
        # Mapear operadores a Python
        op_map = {
            '+': '+', '-': '-', '*': '*', '/': '//'
        }
        
        python_op = op_map.get(quad.operator, quad.operator)
        self.add_line(f"{quad.result} = {op1} {python_op} {op2}")
    
    def generate_comparison(self, quad: Quadruple):
        """Genera código para comparaciones"""
        op1 = self.format_operand(quad.arg1)
        op2 = self.format_operand(quad.arg2)
        
        # Mapear operadores de comparación
        comp_map = {
            '>': '>', '<': '<', '>=': '>=', '<=': '<=', 
            '==': '==', '!=': '!='
        }
        
        python_op = comp_map.get(quad.operator, quad.operator)
        self.add_line(f"{quad.result} = {op1} {python_op} {op2}")
    
    def generate_jump(self, quad: Quadruple, quads: List[Quadruple], current_index: int, label_map: Dict) -> int:
        """Genera código para saltos"""
        
        if quad.operator == "if_false":
            condition = self.format_operand(quad.arg1)
            target_label = quad.result
            
            # (Nota: La lógica para reconstruir if/else es compleja.
            # Por ahora, solo traducimos la línea y evitamos el cuelgue)
            
            self.add_line(f"if not {condition}:")
            self.indent_level += 1
            self.add_line(f"pass  # Saltar a {target_label}")
            self.indent_level -= 1
            
            # --- CORRECCIÓN 1 ---
            # Debe retornar el *siguiente* índice para que el bucle avance
            return current_index + 1
        
        else:  # Salto incondicional
            self.add_line(f"pass  # Saltar a {quad.result}")
            
            # --- CORRECCIÓN 2 (LA CAUSA DEL BUCLE INFINITO) ---
            # Debe retornar el *siguiente* índice para avanzar el bucle
            return current_index + 1
    
    def generate_write(self, quad: Quadruple):
        """Genera código para print"""
        value = self.format_operand(quad.arg1)
        self.add_line(f"print({value})")
    
    def generate_return(self, quad: Quadruple):
        """Genera código para return"""
        value = self.format_operand(quad.arg1) if quad.arg1 else "None"
        self.add_line(f"return {value}")
    
    def format_operand(self, operand: str) -> str:
        """Formatea un operando para Python"""
        if operand is None:
            return "None"
        elif operand.isdigit():
            return operand
        elif operand.startswith('"') and operand.endswith('"'):
            return operand
        elif operand.startswith('t'):
            self.temp_vars.add(operand)
            return operand
        else:
            return operand
    
    def build_label_map(self, quads: List[Quadruple]) -> Dict[str, int]:
        """Construye un mapa de etiquetas a índices"""
        label_map = {}
        for i, quad in enumerate(quads):
            if quad.quadruple_type == QuadrupleType.LABEL:
                label_map[quad.result] = i
        return label_map
    
    def add_line(self, line: str):
        """Agrega una línea de código con la indentación apropiada"""
        indent = "    " * self.indent_level
        self.generated_code.append(f"{indent}{line}")