from app.models.schemas import Token
from typing import List, Tuple
import re

class Lexer:
    def __init__(self):
        # Definición de tokens para nuestro lenguaje similar a C
        self.keywords = {
            'if', 'else', 'while', 'for', 'return', 'function',
            'int', 'float', 'bool', 'string', 'void', 'true', 'false', 'print'
        }
        
        self.operators = {
            '+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=',
            '&&', '||', '!', '++', '--', '+=', '-=', '*=', '/='
        }
        
        self.delimiters = {
            '(', ')', '{', '}', '[', ']', ';', ',', '.', ':'
        }
        
        # Patrones regex para tokens
        # --- CORRECCIÓN ---
        # El ORDEN importa. WHITESPACE y COMMENT deben ir ANTES que OPERATOR
        # para evitar que '//' sea detectado como OPERATOR en lugar de COMMENT.
        self.token_specs = [
            ('NUMBER',    r'\d+(\.\d*)?'),     # Enteros o decimales
            ('STRING',    r'\"([^\\\"]|\\.)*\"'),  # Strings
            ('CHAR',      r"\'([^\\\']|\\.)*\'"),  # Caracteres
            
            # Poner los tokens a ignorar ANTES de las reglas que podrían chocar
            ('WHITESPACE', r'\s+'),            # Espacios en blanco
            ('COMMENT',   r'//.*|/\*[\s\S]*?\*/'),  # Comentarios
            
            ('IDENTIFIER', r'[a-zA-Z_][a-zA-Z0-9_]*'),  # Identificadores
            ('OPERATOR',  r'[+\-*/=<>!&|]+'),  # Operadores
            ('DELIMITER', r'[(){}\[\];,.:]'),  # Delimitadores
            ('MISMATCH',  r'.'),               # Cualquier otro carácter
        ]
        # --- FIN DE LA CORRECCIÓN ---
        
        # Compilar regex
        self.token_regex = '|'.join(f'(?P<{name}>{pattern})' for name, pattern in self.token_specs)
        self.pattern = re.compile(self.token_regex)
    
    def tokenize(self, code: str) -> Tuple[List[Token], List[str]]:
        tokens = []
        errors = []
        line_num = 1
        line_start = 0
        
        for mo in self.pattern.finditer(code):
            kind = mo.lastgroup
            value = mo.group()
            column = mo.start() - line_start + 1
            
            if kind == 'NUMBER':
                # Determinar si es entero o float
                token_type = 'FLOAT' if '.' in value else 'INTEGER'
                tokens.append(Token(type=token_type, value=value, line=line_num, column=column))
                
            elif kind == 'STRING':
                tokens.append(Token(type='STRING', value=value[1:-1], line=line_num, column=column))
                
            elif kind == 'CHAR':
                tokens.append(Token(type='CHAR', value=value[1:-1], line=line_num, column=column))
                
            elif kind == 'IDENTIFIER':
                if value in self.keywords:
                    tokens.append(Token(type='KEYWORD', value=value, line=line_num, column=column))
                else:
                    tokens.append(Token(type='IDENTIFIER', value=value, line=line_num, column=column))
                    
            elif kind == 'OPERATOR':
                tokens.append(Token(type='OPERATOR', value=value, line=line_num, column=column))
                
            elif kind == 'DELIMITER':
                tokens.append(Token(type='DELIMITER', value=value, line=line_num, column=column))
                
            elif kind == 'WHITESPACE':
                # Contar saltos de línea para actualizar número de línea
                line_breaks = value.count('\n')
                if line_breaks > 0:
                    line_num += line_breaks
                    line_start = mo.end() - (len(value) - value.rfind('\n') - 1)
                continue
                
            elif kind == 'COMMENT':
                # Los comentarios se ignoran en el análisis léxico
                line_breaks = value.count('\n')
                if line_breaks > 0:
                    line_num += line_breaks
                    line_start = mo.end() - (len(value) - value.rfind('\n') - 1)
                continue
                
            elif kind == 'MISMATCH':
                errors.append(f"Carácter inesperado '{value}' en línea {line_num}, columna {column}")
                
        return tokens, errors
    
    def pretty_print_tokens(self, tokens: List[Token]):
        """Método auxiliar para imprimir tokens de forma legible"""
        print(f"{'Token':<15} {'Valor':<15} {'Línea':<8} {'Columna':<8}")
        print("-" * 50)
        for token in tokens:
            print(f"{token.type:<15} {token.value:<15} {token.line:<8} {token.column:<8}")