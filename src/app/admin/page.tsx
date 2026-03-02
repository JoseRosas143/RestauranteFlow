
"use client"

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import LocationSelector from '@/components/tenant/LocationSelector';
import { useTenant, useUser } from '@/firebase';
import { ShieldAlert, Loader2 } from 'lucide-react';

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
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (!user) return null;

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
            <h2 className="text-2xl font-bold text-foreground">Configuración de Sucursal</h2>
            <p className="max-w-md mx-auto">Seleccione o cree una sucursal arriba para comenzar a gestionar su restaurante.</p>
          </div>
        </div>
      )}
    </div>
  );
}
