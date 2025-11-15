from app.models.schemas import ASTNode, Token
from typing import List, Optional, Tuple
from app.compiler.lexer import Lexer

class Parser:
    def __init__(self):
        self.tokens = []
        self.current_token = None
        self.token_index = 0
        self.errors = []
    
    def create_ast_node(self, node_type: str, value: str = None, children: List[ASTNode] = None) -> ASTNode:
        """Crea un nodo AST - VERSIÓN SIMPLIFICADA"""
        line = self.current_token.line if self.current_token else None
        column = self.current_token.column if self.current_token else None
        
        # Crear nodo sin children primero, luego agregarlos
        node = ASTNode(
            type=node_type,
            value=value,
            line=line,
            column=column
        )
        
        # Agregar children después de crear el nodo
        if children:
            node.children = children
            
        return node
    
    def parse(self, tokens: List[Token]) -> Tuple[Optional[ASTNode], List[str]]:
        self.tokens = tokens
        self.token_index = 0
        self.errors = []
        
        if not tokens:
            return None, ["No hay tokens para analizar"]
        
        self.current_token = self.tokens[0]
        
        try:
            ast = self.parse_program()
            
            if self.current_token:
                self.errors.append(f"Tokens inesperados después del programa: {self.current_token}")
            
            return ast, self.errors
        except Exception as e:
            self.errors.append(f"Error de parsing: {str(e)}")
            return None, self.errors
    
    def advance(self):
        self.token_index += 1
        if self.token_index < len(self.tokens):
            self.current_token = self.tokens[self.token_index]
        else:
            self.current_token = None
    
    def expect(self, token_type: str, value: str = None) -> bool:
        if not self.current_token:
            self.errors.append(f"Se esperaba {token_type} pero no hay más tokens")
            return False
        
        if self.current_token.type != token_type:
            self.errors.append(f"Se esperaba {token_type} pero se encontró {self.current_token.type} en línea {self.current_token.line}")
            return False
        
        if value and self.current_token.value != value:
            self.errors.append(f"Se esperaba '{value}' pero se encontró '{self.current_token.value}' en línea {self.current_token.line}")
            return False
        
        return True
    
    def consume(self, token_type: str, value: str = None) -> bool:
        if self.expect(token_type, value):
            self.advance()
            return True
        return False
    
    def parse_program(self) -> ASTNode:
        node = self.create_ast_node("Program")
        node.children = []
        
        while self.current_token:
            if self.current_token.type == "KEYWORD" and self.current_token.value == "function":
                function_node = self.parse_function()
                if function_node:
                    node.children.append(function_node)
            else:
                break
        
        return node
    
    def parse_function(self) -> Optional[ASTNode]:
        if not self.consume("KEYWORD", "function"):
            return None
        
        if not self.expect("IDENTIFIER"):
            return None
        
        function_name = self.current_token.value
        self.advance()
        
        if not self.consume("DELIMITER", "("):
            return None
        
        if not self.consume("DELIMITER", ")"):
            return None
        
        block_node = self.parse_block()
        if not block_node:
            return None
        
        return self.create_ast_node("FunctionDeclaration", function_name, [block_node])
    
    def parse_block(self) -> Optional[ASTNode]:
        if not self.consume("DELIMITER", "{"):
            return None
        
        node = self.create_ast_node("Block")
        node.children = []
        
        while self.current_token and self.current_token.value != "}":
            statement = self.parse_statement()
            if statement:
                node.children.append(statement)
            else:
                if self.current_token:
                    self.errors.append(f"Error al parsear statement cerca de '{self.current_token.value}' en línea {self.current_token.line}")
                    self.advance()
                else:
                    break
        
        if not self.consume("DELIMITER", "}"):
            return None
        
        return node
    
    def parse_statement(self) -> Optional[ASTNode]:
        if not self.current_token:
            return None
        
        if self.current_token.type == "KEYWORD":
            if self.current_token.value in ["int", "float", "bool", "string"]:
                return self.parse_declaration()
            elif self.current_token.value == "if":
                return self.parse_if_statement()
            elif self.current_token.value == "while":
                return self.parse_while_statement()
            elif self.current_token.value == "return":
                return self.parse_return_statement()
            elif self.current_token.value == "print":
                return self.parse_print_statement()
        
        return self.parse_assignment_or_expression()
    
    def parse_declaration(self) -> Optional[ASTNode]:
        type_token = self.current_token
        self.advance()
        
        if not self.expect("IDENTIFIER"):
            return None
        
        identifier = self.current_token.value
        self.advance()
        
        initializer = None
        if self.current_token and self.current_token.value == "=":
            self.advance()
            initializer = self.parse_expression()
        
        if not self.consume("DELIMITER", ";"):
            return None
        
        children = [self.create_ast_node("Identifier", identifier)]
        if initializer:
            children.append(initializer)
        
        return self.create_ast_node("VariableDeclaration", type_token.value, children)
    
    def parse_assignment_or_expression(self) -> Optional[ASTNode]:
        if self.current_token and self.current_token.type == "IDENTIFIER":
            identifier = self.current_token.value
            save_index = self.token_index
            
            self.advance()
            
            if self.current_token and self.current_token.value == "=":
                self.advance()
                expression = self.parse_expression()
                
                if expression and self.current_token and self.current_token.value == ";":
                    self.advance()
                    return self.create_ast_node(
                        "Assignment",
                        "=",
                        [
                            self.create_ast_node("Identifier", identifier),
                            expression
                        ]
                    )
            
            self.token_index = save_index
            self.current_token = self.tokens[save_index]
        
        expression = self.parse_expression()
        if expression and self.current_token and self.current_token.value == ";":
            self.advance()
            return self.create_ast_node("ExpressionStatement", None, [expression])
        
        if expression:
            self.errors.append(f"Se esperaba ';' después de la expresión en línea {self.current_token.line}")
        
        return None
    
    def parse_if_statement(self) -> Optional[ASTNode]:
        """IfStatement → 'if' '(' Expression ')' Block ('else' Block)?"""
        if not self.consume("KEYWORD", "if"):
            return None
        
        if not self.consume("DELIMITER", "("):
            return None
        
        condition = self.parse_expression()
        if not condition:
            return None
        
        if not self.consume("DELIMITER", ")"):
            return None
        
        then_branch = self.parse_block()
        if not then_branch:
            return None
        
        else_branch = None
        if self.current_token and self.current_token.value == "else":
            self.advance()  # consume 'else'
            else_branch = self.parse_block()
        
        children = [condition, then_branch]
        if else_branch:
            children.append(else_branch)
        
        # CORRECCIÓN: Sin keyword arguments
        return self.create_ast_node("IfStatement", None, children)
    
    def parse_while_statement(self) -> Optional[ASTNode]:
        """WhileStatement → 'while' '(' Expression ')' Block"""
        if not self.consume("KEYWORD", "while"):
            return None
        
        if not self.consume("DELIMITER", "("):
            return None
        
        condition = self.parse_expression()
        if not condition:
            return None
        
        if not self.consume("DELIMITER", ")"):
            return None
        
        body = self.parse_block()
        if not body:
            return None
        
        # CORRECCIÓN: Sin keyword arguments
        return self.create_ast_node("WhileStatement", None, [condition, body])
    
    def parse_return_statement(self) -> Optional[ASTNode]:
        """ReturnStatement → 'return' Expression? ';'"""
        if not self.consume("KEYWORD", "return"):
            return None
        
        expression = None
        if self.current_token and self.current_token.value != ";":
            expression = self.parse_expression()
        
        if not self.consume("DELIMITER", ";"):
            return None
        
        children = [expression] if expression else []
        # CORRECCIÓN: Sin keyword arguments
        return self.create_ast_node("ReturnStatement", None, children)
    
    def parse_print_statement(self) -> Optional[ASTNode]:
        """PrintStatement → 'print' '(' Expression ')' ';'"""
        if not self.consume("KEYWORD", "print"):
            return None
        
        if not self.consume("DELIMITER", "("):
            return None
        
        expression = self.parse_expression()
        if not expression:
            return None
        
        if not self.consume("DELIMITER", ")"):
            return None
        
        if not self.consume("DELIMITER", ";"):
            return None
        
        # CORRECCIÓN: Sin keyword arguments
        return self.create_ast_node("PrintStatement", None, [expression])
    
    def parse_expression(self) -> Optional[ASTNode]:
        """Expression → RelationalExpression"""
        return self.parse_relational_expression()
    
    def parse_relational_expression(self) -> Optional[ASTNode]:
        """RelationalExpression → AdditiveExpression (('>' | '<' | '==' | '!=') AdditiveExpression)*"""
        left = self.parse_additive_expression()
        if not left:
            return None
        
        while self.current_token and self.current_token.value in [">", "<", "==", "!="]:
            operator = self.current_token.value
            self.advance()  # consume operator
            right = self.parse_additive_expression()
            if not right:
                return None
            
            # CORRECCIÓN: Sin keyword arguments
            left = self.create_ast_node("BinaryExpression", operator, [left, right])
        
        return left

    def parse_additive_expression(self) -> Optional[ASTNode]:
        """AdditiveExpression → MultiplicativeExpression (('+' | '-') MultiplicativeExpression)*"""
        left = self.parse_multiplicative_expression()
        if not left:
            return None
        
        while self.current_token and self.current_token.value in ["+", "-"]:
            operator = self.current_token.value
            self.advance()  # consume operator
            right = self.parse_multiplicative_expression()
            if not right:
                return None
            
            # CORRECCIÓN: Sin keyword arguments
            left = self.create_ast_node("BinaryExpression", operator, [left, right])
        
        return left
    
    def parse_multiplicative_expression(self) -> Optional[ASTNode]:
        """MultiplicativeExpression → PrimaryExpression (('*' | '/') PrimaryExpression)*"""
        left = self.parse_primary_expression()
        if not left:
            return None
        
        while self.current_token and self.current_token.value in ["*", "/"]:
            operator = self.current_token.value
            self.advance()  # consume operator
            right = self.parse_primary_expression()
            if not right:
                return None
            
            # CORRECCIÓN: Sin keyword arguments
            left = self.create_ast_node("BinaryExpression", operator, [left, right])
        
        return left
    
    def parse_primary_expression(self) -> Optional[ASTNode]:
        """PrimaryExpression → IDENTIFIER | NUMBER | STRING | '(' Expression ')' | BOOLEAN"""
        if not self.current_token:
            return None
        
        if self.current_token.type == "IDENTIFIER":
            # CORRECCIÓN: Sin keyword arguments
            node = self.create_ast_node("Identifier", self.current_token.value, None)
            self.advance()
            return node
        
        elif self.current_token.type in ["INTEGER", "FLOAT"]:
            # CORRECCIÓN: Sin keyword arguments
            node = self.create_ast_node("Literal", self.current_token.value, None)
            self.advance()
            return node
        
        elif self.current_token.type == "STRING":
            # CORRECCIÓN: Sin keyword arguments
            node = self.create_ast_node("StringLiteral", self.current_token.value, None)
            self.advance()
            return node
        
        elif self.current_token.type == "BOOLEAN":
            # CORRECCIÓN: Sin keyword arguments
            node = self.create_ast_node("BooleanLiteral", self.current_token.value, None)
            self.advance()
            return node
        
        elif self.current_token.value == "(":
            self.advance()  # consume '('
            expression = self.parse_expression()
            if not expression:
                return None
            if not self.consume("DELIMITER", ")"):
                return None
            return expression
        
        else:
            self.errors.append(f"Expresión primaria esperada pero se encontró {self.current_token.type} '{self.current_token.value}' en línea {self.current_token.line}")
            return None

    def pretty_print_ast(self, node: ASTNode, level=0):
        """Método auxiliar para imprimir el AST de forma legible"""
        indent = "  " * level
        position = f" [L{node.line}:C{node.column}]" if node.line else ""
        if node.children:
            print(f"{indent}{node.type}({node.value or ''}){position}")
            for child in node.children:
                self.pretty_print_ast(child, level + 1)
        else:
            print(f"{indent}{node.type}: {node.value}{position}")