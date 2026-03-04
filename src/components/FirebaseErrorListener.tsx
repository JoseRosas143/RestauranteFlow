'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Escucha los errores de permisos pero NO bloquea la pantalla.
 * Solo los imprime en consola para que puedas seguir trabajando.
 * Esto evita la "pantalla roja" de Next.js durante el desarrollo.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Solo imprimimos el error en la consola para no interrumpir el flujo visual
      console.group('⚠️ Firestore Permission Denied');
      console.warn('Path:', error.request.path);
      console.warn('Method:', error.request.method);
      console.dir(error.request);
      console.groupEnd();
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}