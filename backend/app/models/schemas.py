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

class ASTNode(BaseModel):
    type: str
    value: Optional[str] = None
    children: Optional[List['ASTNode']] = None
    line: Optional[int] = None
    data_type: Optional[DataType] = None

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

# CORREGIDO: Solución para la referencia circular
class SymbolTable(BaseModel):
    symbols: Dict[str, Symbol] = {}
    scope_name: str = "global"
    level: int = 0
    children: List['SymbolTable'] = []

    # Configuración para manejar la referencia circular
    class Config:
        arbitrary_types_allowed = True

# Ahora definimos parent después de definir SymbolTable
SymbolTable.update_forward_refs()

class SemanticResult(BaseModel):
    symbol_table: SymbolTable
    errors: List[str] = []
    warnings: List[str] = []

class IntermediateCode(BaseModel):
    quadruples: List[Quadruple] = []
    temporal_counter: int = 0
    label_counter: int = 0

class CompileResponse(BaseModel):
    success: bool
    ast: Optional[ASTNode] = None
    tokens: Optional[List[Token]] = None
    symbol_table: Optional[SymbolTable] = None
    intermediate_code: Optional[List[Quadruple]] = None
    optimized_code: Optional[List[Quadruple]] = None
    object_code: Optional[str] = None
    errors: List[str] = []
    warnings: List[str] = []
    metrics: Optional[Dict[str, Any]] = None