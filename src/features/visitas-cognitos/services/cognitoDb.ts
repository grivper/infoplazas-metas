/**
 * Servicio de persistencia para datos de COGNITO.
 * Usa IndexedDB como almacenamiento local.
 * Diseñado para ser reemplazable por Supabase en el futuro.
 */

// --- Tipos exportados ---
export interface VisitaCognito {
  id: string;        // Campo "#" del CSV (llave primaria)
  fecha: string;     // Fecha original del CSV
  mes: number;       // Mes extraído (1-12)
  enlace: string;    // Enlace Regional
  infoplaza: string; // Nombre de la Infoplaza
}

// --- Constantes de la BD ---
const DB_NAME = 'metas_infoplazas';
const DB_VERSION = 5;
const STORE_NAME = 'cognito_visitas';

// --- Abre o crea la base de datos ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      // Store compartido con el módulo Mesas
      if (!db.objectStoreNames.contains('mesas_transformacion')) {
        db.createObjectStore('mesas_transformacion', { keyPath: 'id' });
      }
      // Store compartido con el módulo Plan de Visitas
      if (!db.objectStoreNames.contains('rutas_maestras')) {
        db.createObjectStore('rutas_maestras', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    // Cambiamos string estático a error detallado de DB para diagnosticar la falla real.
    request.onerror = () => {
      const err = request.error;
      reject(new Error(`Error al abrir IndexedDB: ${err?.name} - ${err?.message}`));
    };
    // Manejo de upgrade bloqueado (pestañas viejas abiertas)
    request.onblocked = () => {
      reject(new Error('Apertura de Base de Datos BLOQUEADA. Cierra otras pestañas de esta aplicación y recarga.'));
    };
  });
};

// --- Upsert: Guarda o sobrescribe registros por ID ---
export const upsertVisitas = async (visitas: VisitaCognito[]): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    let count = 0;

    visitas.forEach((v) => {
      // Usamos put explícitamente para asegurar un comportamiento de UPSERT.
      // Si el ID ya existe, lo sobrescribe en vez de fallar con ConstraintError.
      store.put(v);
      count++;
    });

    tx.oncomplete = () => { db.close(); resolve(count); };
    tx.onerror = () => {
      const dbErr = tx.error?.message || 'Error desconocido';
      db.close();
      reject(new Error(`Error en upsert: ${dbErr}`));
    };
  });
};

// --- Lee todos los registros ---
export const getAllVisitas = async (): Promise<VisitaCognito[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(new Error('Error al leer datos')); };
  });
};

// --- Cuenta total de registros ---
export const countVisitas = async (): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(new Error('Error al contar')); };
  });
};

// --- Limpia todos los registros (útil para testing) ---
export const clearVisitas = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();

    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(new Error('Error al limpiar')); };
  });
};
