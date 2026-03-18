/**
 * Lee un archivo File y devuelve su contenido como string,
 * detectando automáticamente si es UTF-8 o Windows-1252.
 */
export const decodeCSVFile = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  
  try {
    // Intentamos UTF-8 primero (fatal: true hace que lance error si hay bytes inválidos)
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(buffer);
  } catch (e) {
    console.warn('Fallo decodificación UTF-8, intentando Windows-1252 (Excel Latam)...');
    // Fallback a Windows-1252 para archivos de Excel antiguos en español
    const fallbackDecoder = new TextDecoder('windows-1252');
    return fallbackDecoder.decode(buffer);
  }
};
