
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      toast({
        variant: "destructive",
        title: "Error de Permisos",
        description: error.message,
      });
      // Lanzar error para que sea capturado por el overlay de desarrollo de Next.js
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.removeListener('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
