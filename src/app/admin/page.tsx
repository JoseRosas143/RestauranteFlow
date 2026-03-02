
"use client"

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import LocationSelector from '@/components/tenant/LocationSelector';
import { useTenant, useUser } from '@/firebase';
import { ShieldAlert, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const { orgId, locId } = useTenant();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-12 w-12 text-primary" />
          <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Sincronizando Perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Manejo de caso donde el usuario no tiene orgId (perfil incompleto)
  if (!orgId) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 text-center space-y-6 bg-background">
        <div className="p-6 bg-destructive/10 rounded-full">
          <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-primary">Perfil Incompleto</h2>
          <p className="max-w-md mx-auto text-muted-foreground font-bold">No hemos podido encontrar una organización vinculada a tu cuenta. Contacta a soporte o intenta registrar tu negocio de nuevo.</p>
        </div>
        <Button onClick={() => router.push('/')} variant="outline" className="h-14 px-8 rounded-2xl font-black gap-2 border-2">
          <Home className="h-5 w-5" /> VOLVER AL INICIO
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* El LocationSelector aparecerá automáticamente si locId es null */}
      <LocationSelector />
      
      {orgId && locId && <AdminDashboard />}
      
      {orgId && !locId && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
          <div className="animate-bounce">
            <ShieldAlert className="h-20 w-20 text-primary/20" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tighter italic">Configuración de Sucursal</h2>
            <p className="max-w-md mx-auto font-bold opacity-60">Seleccione o cree una sucursal arriba para comenzar a gestionar su restaurante.</p>
          </div>
        </div>
      )}
    </div>
  );
}
