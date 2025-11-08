from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Aquí importamos el router desde compile.py
# Asumiendo que está en app/api/compile.py
from app.api.compile import router as compile_router 

print("--- Iniciando main.py ---")

app = FastAPI(
    title="Compilador Web Interactivo",
    description="Compilador educativo para Lenguajes y Autómatas II",
    version="1.0.0"
)

# Configurar CORS para permitir requests del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ESTA ES LA PARTE IMPORTANTE ---
# Registramos el router de compile.py
# Ahora, las peticiones a /api/compile serán manejadas
# por el código en tu archivo compile.py
try:
    app.include_router(compile_router, prefix="/api")
    print("Router de /api/compile cargado exitosamente.")
except Exception as e:
    print(f"!!! ERROR AL CARGAR EL ROUTER: {e} !!!")
# ------------------------------------

@app.get("/")
async def root():
    return {"message": "Compilador Web Interactivo API", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/ast")
async def get_ast():
    return {"message": "AST endpoint - usar /api/compile para obtener AST"}

@app.get("/api/symbol-table")
async def get_symbol_table():
    return {"message": "Symbol table endpoint - usar /api/compile para obtener AST"}

print("--- main.py cargado ---")