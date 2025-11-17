// CORREGIDO: Mejor manejo de errores y logging
const API_BASE_URL = 'http://localhost:5000';

export const compileCode = async (code) => {
  try {
    console.log('📤 Enviando solicitud de compilación...');
    
    const response = await fetch(`${API_BASE_URL}/api/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    console.log('📥 Respuesta recibida, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error HTTP:', response.status, errorText);
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Compilación exitosa, datos recibidos:');
    console.log('  - Success:', result.success);
    console.log('  - Tokens:', result.tokens?.length || 0);
    console.log('  - AST:', result.ast ? 'Sí' : 'No');
    console.log('  - Symbol Table:', result.symbol_table ? 'Sí' : 'No');
    console.log('  - Intermediate Code:', result.intermediate_code?.length || 0);
    console.log('  - Errors:', result.errors?.length || 0);
    console.log('  - Warnings:', result.warnings?.length || 0);
    
    return result;
  } catch (error) {
    console.error('💥 Error en compileCode:', error);
    
    // Mejor mensaje de error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se puede conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:5000');
    }
    
    throw new Error(error.message || 'Error desconocido al compilar el código');
  }
};

// Función auxiliar para verificar conexión
export const checkServerConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('No se puede conectar al servidor:', error);
    return false;
  }
};

export const lintCode = async (code) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/lint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Linting completado:', {
      errors: result.errors?.length || 0,
      warnings: result.warnings?.length || 0
    });
    
    return result;
  } catch (error) {
    console.error('💥 Error en lintCode:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('No se puede conectar con el servidor');
    }
    
    throw new Error(error.message || 'Error desconocido en linting');
  }
};