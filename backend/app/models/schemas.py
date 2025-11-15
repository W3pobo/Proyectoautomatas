from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from enum import Enum

class SymbolType(str, Enum):
    VARIABLE = "variable"
    FUNCTION = "function"
    PARAMETER = "parameter"
    TEMPORAL = "temporal"

class DataType(str, Enum):
    INT = "int"
    FLOAT = "float"
    BOOL = "bool"
    STRING = "string"
    VOID = "void"

class CompileRequest(BaseModel):
    code: str

class Token(BaseModel):
    type: str
    value: str
    line: int
    column: int

# SOLUCIÓN: Definir ASTNode sin children primero, luego actualizar
class ASTNodeBase(BaseModel):
    type: str
    value: Optional[str] = None
    line: Optional[int] = None
    column: Optional[int] = None
    data_type: Optional[DataType] = None

    class Config:
        arbitrary_types_allowed = True

# Ahora definir ASTNode completo con children
class ASTNode(ASTNodeBase):
    children: Optional[List['ASTNode']] = []

    def dict(self, *args, **kwargs):
        """Override para evitar referencias circulares"""
        # Usar exclude para evitar serializar children si causa problemas
        kwargs.setdefault('exclude', set()).add('children')
        data = super().dict(*args, **kwargs)
        
        # Serializar children manualmente si existen
        if self.children:
            data['children'] = [child.dict(exclude={'children'}) for child in self.children]
        return data

# CORREGIDO: Eliminamos la duplicación de Quadruple
class QuadrupleType(str, Enum):
    ARITHMETIC = "arithmetic"
    ASSIGNMENT = "assignment"
    COMPARISON = "comparison"
    JUMP = "jump"
    LABEL = "label"
    PARAM = "param"
    CALL = "call"
    RETURN = "return"
    READ = "read"
    WRITE = "write"

class Quadruple(BaseModel):
    index: int
    operator: str
    arg1: Optional[str] = None
    arg2: Optional[str] = None
    result: Optional[str] = None
    quadruple_type: QuadrupleType
    line: Optional[int] = None

class Symbol(BaseModel):
    name: str
    symbol_type: SymbolType
    data_type: DataType
    scope: str
    line: int
    initialized: bool = False
    used: bool = False
    memory_address: Optional[int] = None
    dimensions: List[int] = []  # Para arreglos
    parameters: List[DataType] = []  # Para funciones

# SOLUCIÓN: SymbolTable sin parent primero
class SymbolTableBase(BaseModel):
    symbols: Dict[str, Symbol] = {}
    scope_name: str = "global"
    level: int = 0

class SymbolTable(SymbolTableBase):
    children: List['SymbolTable'] = []
    
    # --- INICIO DE LA CORRECCIÓN ---
    # Excluimos el campo 'parent' de la serialización JSON
    # para romper la referencia circular.
    parent: Optional['SymbolTable'] = Field(None, exclude=True)
    # --- FIN DE LA CORRECCIÓN ---

    class Config:
        arbitrary_types_allowed = True

class SemanticResult(BaseModel):
    symbol_table: SymbolTable
    errors: List[str] = []
    warnings: List[str] = []

class IntermediateCode(BaseModel):
    quadruples: List[Quadruple] = []
    temporal_counter: int = 0
    label_counter: int = 0

    def dict(self, *args, **kwargs):
        """Override para serialización correcta"""
        data = super().dict(*args, **kwargs)
        if 'quadruples' in data and data['quadruples']:
            data['quadruples'] = [quad.dict() for quad in self.quadruples]
        return data

class CompileResponse(BaseModel):
    success: bool
    ast: Optional[ASTNode] = None
    tokens: Optional[List[Token]] = None
    symbol_table: Optional[SymbolTable] = None
    intermediate_code: Optional[IntermediateCode] = None
    optimized_code: Optional[IntermediateCode] = None
    object_code: Optional[str] = None
    errors: List[str] = []
    warnings: List[str] = []
    metrics: Optional[Dict[str, Any]] = None
    debug_info: Optional[Dict[str, Any]] = None

    class Config:
        arbitrary_types_allowed = True

# Actualizar referencias forward
ASTNode.update_forward_refs()
SymbolTable.update_forward_refs()