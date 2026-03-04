'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Escucha los errores de permisos pero NO bloquea la pantalla.
 * Solo los imprime en consola para que puedas seguir trabajando.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Solo imprimimos el error en la consola para no interrumpir el flujo visual
      console.warn('⚠️ Error de Permisos en Firestore:', error.message);
      console.dir(error.request);
      // Opcional: podrías mostrar un toast pequeño aquí si lo deseas
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // Hemos eliminado el "if (error) throw error;" para evitar la pantalla roja de Next.js
  return null;
}