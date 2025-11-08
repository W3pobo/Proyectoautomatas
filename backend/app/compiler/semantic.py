from app.models.schemas import ASTNode, SymbolTable, Symbol, SemanticResult, SymbolType, DataType
from typing import List, Optional, Dict

class SemanticAnalyzer:
    def __init__(self):
        self.current_scope = "global"
        self.symbol_table = SymbolTable(scope_name="global", level=0)
        self.errors = []
        self.warnings = []
        self.scope_stack = [self.symbol_table]
        self.memory_counter = 0
    
    def analyze(self, ast: ASTNode) -> SemanticResult:
        """Analiza el AST semánticamente"""
        if not ast:
            return SemanticResult(
                symbol_table=self.symbol_table,
                errors=["No hay AST para analizar"]
            )
        
        print("=== INICIANDO ANÁLISIS SEMÁNTICO ===")
        self.visit_node(ast)
        self.check_unused_variables()
        self.check_initialized_variables()
        
        print(f"=== ANÁLISIS COMPLETADO ===")
        print(f"Errores: {len(self.errors)}")
        print(f"Advertencias: {len(self.warnings)}")
        print(f"Símbolos en tabla global: {len(self.symbol_table.symbols)}")
        
        return SemanticResult(
            symbol_table=self.symbol_table,
            errors=self.errors,
            warnings=self.warnings
        )
    
    def enter_scope(self, scope_name: str):
        """Entra a un nuevo scope"""
        parent_table = self.scope_stack[-1]
        new_table = SymbolTable(
            scope_name=scope_name,
            parent=parent_table,
            level=parent_table.level + 1
        )
        parent_table.children.append(new_table)
        self.scope_stack.append(new_table)
        self.current_scope = scope_name
        print(f"🔽 Entrando al scope: {scope_name}")
    
    def exit_scope(self):
        """Sale del scope actual"""
        if len(self.scope_stack) > 1:
            old_scope = self.scope_stack.pop()
            self.current_scope = self.scope_stack[-1].scope_name
            print(f"🔼 Saliendo del scope: {old_scope.scope_name}")
    
    def get_current_table(self) -> SymbolTable:
        """Obtiene la tabla de símbolos actual"""
        return self.scope_stack[-1]
    
    def visit_node(self, node: ASTNode):
        """Visita un nodo del AST y realiza análisis semántico"""
        if not node:
            return
            
        method_name = f'visit_{node.type.lower()}'
        visitor = getattr(self, method_name, self.visit_default)
        return visitor(node)
    
    def visit_default(self, node: ASTNode):
        """Visitante por defecto para nodos no especificados"""
        if node.children:
            for child in node.children:
                self.visit_node(child)
    
    def visit_program(self, node: ASTNode):
        """Visita el nodo Program"""
        if node.children:
            for child in node.children:
                self.visit_node(child)
    
    def visit_functiondeclaration(self, node: ASTNode):
        """Visita una declaración de función"""
        function_name = node.value
        
        # Verificar si la función ya existe en scope global
        if function_name in self.symbol_table.symbols:
            self.errors.append(f"Función '{function_name}' ya declarada (línea {node.line})")
            return
        
        # Agregar función a la tabla global
        function_entry = Symbol(
            name=function_name,
            symbol_type=SymbolType.FUNCTION,
            data_type=DataType.VOID,
            scope="global",
            line=node.line or 0,
            memory_address=self.allocate_memory()
        )
        self.symbol_table.symbols[function_name] = function_entry
        
        # Entrar al scope de la función
        self.enter_scope(function_name)
        
        # Visitar el cuerpo de la función
        if node.children:
            self.visit_node(node.children[0])  # Block
        
        # Salir del scope de la función
        self.exit_scope()
    
    def visit_block(self, node: ASTNode):
        """Visita un bloque de código"""
        if node.children:
            for child in node.children:
                self.visit_node(child)
    
    def visit_variabledeclaration(self, node: ASTNode):
        """Visita una declaración de variable"""
        if not node.children:
            return
        
        variable_name = node.children[0].value
        variable_type = DataType(node.value)  # 'int', 'float', etc.
        
        current_table = self.get_current_table()
        
        # Verificar si la variable ya existe en el scope actual
        if variable_name in current_table.symbols:
            self.errors.append(f"Variable '{variable_name}' ya declarada en el scope '{self.current_scope}' (línea {node.line})")
            return
        
        # Determinar si está inicializada
        is_initialized = len(node.children) > 1 and node.children[1].type != "Empty"
        
        # Agregar variable a la tabla de símbolos actual
        current_table.symbols[variable_name] = Symbol(
            name=variable_name,
            symbol_type=SymbolType.VARIABLE,
            data_type=variable_type,
            scope=self.current_scope,
            line=node.line or 0,
            initialized=is_initialized,
            memory_address=self.allocate_memory()
        )
        
        print(f"📝 Variable declarada: {variable_name} ({variable_type}) en scope {self.current_scope}")
        
        # Verificar inicialización
        if is_initialized:
            self.visit_node(node.children[1])  # Expression de inicialización
    
    def visit_assignment(self, node: ASTNode):
        """Visita una asignación"""
        if not node.children:
            return
        
        variable_name = node.children[0].value
        
        # Verificar si la variable existe
        symbol = self.lookup_symbol(variable_name)
        if not symbol:
            self.errors.append(f"Variable '{variable_name}' no declarada (línea {node.line})")
        else:
            # Marcar variable como inicializada y usada
            symbol.initialized = True
            symbol.used = True
            print(f"🔄 Variable asignada: {variable_name}")
        
        # Visitar la expresión del lado derecho
        if len(node.children) > 1:
            self.visit_node(node.children[1])
    
    def visit_identifier(self, node: ASTNode):
        """Visita un identificador"""
        variable_name = node.value
        
        # Verificar si la variable existe
        symbol = self.lookup_symbol(variable_name)
        if not symbol:
            self.errors.append(f"Variable '{variable_name}' no declarada (línea {node.line})")
        else:
            # Marcar variable como usada
            symbol.used = True
            
            # Verificar si está inicializada
            if not symbol.initialized:
                self.warnings.append(f"Variable '{variable_name}' usada pero puede no estar inicializada (línea {node.line})")
            
            print(f"🔍 Variable usada: {variable_name}")
    
    def visit_ifstatement(self, node: ASTNode):
        """Visita una sentencia if"""
        if node.children:
            # Visitar condición
            self.visit_node(node.children[0])
            
            # Entrar al scope del bloque then
            self.enter_scope(f"if_block_{node.line}")
            
            # Visitar bloque then
            if len(node.children) > 1:
                self.visit_node(node.children[1])
            
            # Salir del scope del bloque then
            self.exit_scope()
            
            # Visitar bloque else si existe
            if len(node.children) > 2:
                self.enter_scope(f"else_block_{node.line}")
                self.visit_node(node.children[2])
                self.exit_scope()
    
    def visit_whilestatement(self, node: ASTNode):
        """Visita una sentencia while"""
        if node.children:
            # Visitar condición
            self.visit_node(node.children[0])
            
            # Entrar al scope del bloque while
            self.enter_scope(f"while_block_{node.line}")
            
            # Visitar cuerpo
            if len(node.children) > 1:
                self.visit_node(node.children[1])
            
            # Salir del scope del bloque while
            self.exit_scope()
    
    def visit_returnstatement(self, node: ASTNode):
        """Visita una sentencia return"""
        if node.children:
            for child in node.children:
                self.visit_node(child)
    
    def visit_binaryexpression(self, node: ASTNode):
        """Visita una expresión binaria"""
        if node.children:
            for child in node.children:
                self.visit_node(child)
    
    def visit_literal(self, node: ASTNode):
        """Visita un literal"""
        pass  # Los literales no requieren análisis semántico
    
    def visit_stringliteral(self, node: ASTNode):
        """Visita un string literal"""
        pass
    
    def lookup_symbol(self, name: str) -> Optional[Symbol]:
        """Busca un símbolo en la tabla actual y padres"""
        for table in reversed(self.scope_stack):
            if name in table.symbols:
                return table.symbols[name]
        return None
    
    def allocate_memory(self) -> int:
        """Asigna una dirección de memoria única"""
        address = self.memory_counter
        self.memory_counter += 1
        return address
    
    def check_unused_variables(self):
        """Verifica variables declaradas pero no usadas"""
        def check_table(table: SymbolTable):
            for symbol_name, symbol in table.symbols.items():
                if symbol.symbol_type == SymbolType.VARIABLE and not symbol.used:
                    self.warnings.append(f"Variable '{symbol_name}' declarada pero no usada en scope '{symbol.scope}'")
            
            for child_table in table.children:
                check_table(child_table)
        
        check_table(self.symbol_table)
    
    def check_initialized_variables(self):
        """Verifica variables no inicializadas"""
        def check_table(table: SymbolTable):
            for symbol_name, symbol in table.symbols.items():
                if (symbol.symbol_type == SymbolType.VARIABLE and 
                    symbol.used and not symbol.initialized):
                    self.warnings.append(f"Variable '{symbol_name}' usada pero no inicializada en scope '{symbol.scope}'")
            
            for child_table in table.children:
                check_table(child_table)
        
        check_table(self.symbol_table)