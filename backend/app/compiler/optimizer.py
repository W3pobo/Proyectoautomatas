from app.models.schemas import Quadruple, QuadrupleType
from typing import List, Dict, Set
import re

class CodeOptimizer:
    def __init__(self):
        self.optimizations_applied = []
    
    def optimize(self, quadruples: List[Quadruple]) -> List[Quadruple]:
        """Aplica optimizaciones al código intermedio"""
        if not quadruples:
            return []
        
        print("=== INICIANDO OPTIMIZACIÓN ===")
        print(f"Cuádruplos antes de optimizar: {len(quadruples)}")
        
        # Aplicar optimizaciones en secuencia
        optimized_quads = quadruples.copy()
        
        # 1. Plegado de constantes
        optimized_quads = self.constant_folding(optimized_quads)
        
        # 2. Propagación de constantes
        optimized_quads = self.constant_propagation(optimized_quads)
        
        # 3. Eliminación de código muerto
        optimized_quads = self.dead_code_elimination(optimized_quads)
        
        # 4. Eliminación de asignaciones redundantes
        optimized_quads = self.redundant_assignment_elimination(optimized_quads)
        
        # 5. Optimización de saltos
        optimized_quads = self.jump_optimization(optimized_quads)
        
        # Reindexar los cuádruplos
        for i, quad in enumerate(optimized_quads):
            quad.index = i
        
        print(f"=== OPTIMIZACIÓN COMPLETADA ===")
        print(f"Cuádruplos después de optimizar: {len(optimized_quads)}")
        print(f"Optimizaciones aplicadas: {len(self.optimizations_applied)}")
        for opt in self.optimizations_applied:
            print(f"  - {opt}")
        
        return optimized_quads
    
    def constant_folding(self, quadruples: List[Quadruple]) -> List[Quadruple]:
        """Optimización: Plegado de constantes"""
        optimized = []
        changes = 0
        
        for quad in quadruples:
            if (quad.quadruple_type == QuadrupleType.ARITHMETIC and
                self.is_constant(quad.arg1) and self.is_constant(quad.arg2)):
                
                # Calcular el resultado en tiempo de compilación
                result = self.evaluate_constant_expression(
                    quad.arg1, quad.arg2, quad.operator
                )
                
                if result is not None:
                    # Reemplazar por asignación directa
                    new_quad = Quadruple(
                        index=quad.index,
                        operator="=",
                        arg1=str(result),
                        arg2=None,
                        result=quad.result,
                        quadruple_type=QuadrupleType.ASSIGNMENT,
                        line=quad.line
                    )
                    optimized.append(new_quad)
                    self.optimizations_applied.append(f"Plegado de constantes: {quad.arg1} {quad.operator} {quad.arg2} -> {result}")
                    changes += 1
                    continue
            
            optimized.append(quad)
        
        print(f"🔧 Plegado de constantes: {changes} cambios")
        return optimized
    
    def constant_propagation(self, quadruples: List[Quadruple]) -> List[Quadruple]:
        """Optimización: Propagación de constantes"""
        constant_map = {}  # variable -> valor constante
        optimized = []
        changes = 0
        
        for quad in quadruples:
            new_quad = quad
            
            # Si es una asignación de constante, registrar
            if (quad.quadruple_type == QuadrupleType.ASSIGNMENT and 
                self.is_constant(quad.arg1)):
                constant_map[quad.result] = quad.arg1
                self.optimizations_applied.append(f"Propagación: {quad.result} = {quad.arg1}")
                changes += 1
            
            # Reemplazar usos de variables con sus valores constantes
            elif quad.arg1 in constant_map and self.is_constant(constant_map[quad.arg1]):
                new_quad = Quadruple(
                    index=quad.index,
                    operator=quad.operator,
                    arg1=constant_map[quad.arg1],
                    arg2=quad.arg2,
                    result=quad.result,
                    quadruple_type=quad.quadruple_type,
                    line=quad.line
                )
                self.optimizations_applied.append(f"Reemplazo: {quad.arg1} -> {constant_map[quad.arg1]}")
                changes += 1
            
            # Si la variable es reasignada, remover de constantes
            if (quad.quadruple_type == QuadrupleType.ASSIGNMENT and 
                quad.result in constant_map and 
                not self.is_constant(quad.arg1)):
                del constant_map[quad.result]
            
            optimized.append(new_quad)
        
        print(f"📤 Propagación de constantes: {changes} cambios")
        return optimized
    
    def dead_code_elimination(self, quadruples: List[Quadruple]) -> List[Quadruple]:
        """Optimización: Eliminación de código muerto"""
        used_vars = self.find_used_variables(quadruples)
        optimized = []
        changes = 0
        
        for quad in quadruples:
            # Eliminar asignaciones a variables no usadas (que no son temporales)
            if (quad.quadruple_type == QuadrupleType.ASSIGNMENT and
                quad.result.startswith('t') and quad.result not in used_vars):
                self.optimizations_applied.append(f"Código muerto eliminado: {quad.result}")
                changes += 1
                continue
            
            # Eliminar etiquetas no referenciadas
            if (quad.quadruple_type == QuadrupleType.LABEL and
                
                # --- INICIO DE LA CORRECCIÓN ---
                # No eliminar etiquetas de función (ej. "func_main")
                not quad.result.startswith("func_") and
                # --- FIN DE LA CORRECCIÓN ---
                
                not self.is_label_referenced(quad.result, quadruples)):
                
                self.optimizations_applied.append(f"Etiqueta no usada eliminada: {quad.result}")
                changes += 1
                continue
            
            optimized.append(quad)
        
        print(f"🧹 Eliminación de código muerto: {changes} cambios")
        return optimized
    
    def redundant_assignment_elimination(self, quadruples: List[Quadruple]) -> List[Quadruple]:
        """Optimización: Eliminación de asignaciones redundantes"""
        optimized = []
        changes = 0
        last_assignment = {}  # variable -> último valor asignado
        
        for quad in quadruples:
            if quad.quadruple_type == QuadrupleType.ASSIGNMENT:
                # Si es la misma asignación repetida, eliminar
                if (quad.result in last_assignment and 
                    last_assignment[quad.result] == quad.arg1):
                    self.optimizations_applied.append(f"Asignación redundante eliminada: {quad.result} = {quad.arg1}")
                    changes += 1
                    continue
                
                last_assignment[quad.result] = quad.arg1
            
            # Resetear seguimiento en saltos y etiquetas
            elif quad.quadruple_type in [QuadrupleType.JUMP, QuadrupleType.LABEL]:
                last_assignment.clear()
            
            optimized.append(quad)
        
        print(f"🚫 Eliminación de asignaciones redundantes: {changes} cambios")
        return optimized
    
    def jump_optimization(self, quadruples: List[Quadruple]) -> List[Quadruple]:
        """Optimización: Simplificación de saltos"""
        optimized = []
        changes = 0
        i = 0
        
        while i < len(quadruples):
            current = quadruples[i]
            
            # Saltos consecutivos
            if (i + 1 < len(quadruples) and
                current.quadruple_type == QuadrupleType.JUMP and
                quadruples[i + 1].quadruple_type == QuadrupleType.LABEL and
                current.result == quadruples[i + 1].result):
                
                # Eliminar salto redundante
                self.optimizations_applied.append(f"Salto redundante eliminado a {current.result}")
                changes += 1
                i += 1  # Saltar el cuádruplo actual
                continue
            
            optimized.append(current)
            i += 1
        
        print(f"⤴️ Optimización de saltos: {changes} cambios")
        return optimized
    
    def is_constant(self, value: str) -> bool:
        """Verifica si un valor es constante (número)"""
        if value is None:
            return False
        return value.isdigit() or (value.startswith('"') and value.endswith('"'))
    
    def evaluate_constant_expression(self, arg1: str, arg2: str, operator: str) -> int:
        """Evalúa una expresión constante en tiempo de compilación"""
        try:
            val1 = int(arg1)
            val2 = int(arg2)
            
            if operator == '+': return val1 + val2
            elif operator == '-': return val1 - val2
            elif operator == '*': return val1 * val2
            elif operator == '/': return val1 // val2 if val2 != 0 else None
            elif operator == '>': return 1 if val1 > val2 else 0
            elif operator == '<': return 1 if val1 < val2 else 0
            elif operator == '>=': return 1 if val1 >= val2 else 0
            elif operator == '<=': return 1 if val1 <= val2 else 0
            elif operator == '==': return 1 if val1 == val2 else 0
            elif operator == '!=': return 1 if val1 != val2 else 0
        except:
            return None
        
        return None
    
    def find_used_variables(self, quadruples: List[Quadruple]) -> Set[str]:
        """Encuentra todas las variables usadas en los cuádruplos"""
        used = set()
        
        for quad in quadruples:
            if quad.arg1 and quad.arg1.startswith('t'):
                used.add(quad.arg1)
            if quad.arg2 and quad.arg2.startswith('t'):
                used.add(quad.arg2)
            if quad.result and quad.result.startswith('t'):
                used.add(quad.result)
        
        return used
    
    def is_label_referenced(self, label: str, quadruples: List[Quadruple]) -> bool:
        """Verifica si una etiqueta es referenciada por algún salto"""
        for quad in quadruples:
            if (quad.quadruple_type == QuadrupleType.JUMP and 
                quad.result == label):
                return True
        return False
    
    def get_optimization_report(self) -> Dict[str, any]:
        """Genera un reporte de las optimizaciones aplicadas"""
        return {
            "total_optimizations": len(self.optimizations_applied),
            "optimizations": self.optimizations_applied,
            "reduction_percentage": 0  # Se calculará después
        }