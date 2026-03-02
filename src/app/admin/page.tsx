
"use client"

import AdminDashboard from '@/components/admin/AdminDashboard';
import LocationSelector from '@/components/tenant/LocationSelector';
import { useTenant } from '@/firebase';
import { Store, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const { orgId, locId, setLoc } = useTenant();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LocationSelector />
      
      {orgId && <AdminDashboard />}
      
      {!orgId && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
          <ShieldAlert className="h-20 w-20 opacity-20" />
          <div>
            <h2 className="text-2xl font-bold">Autenticación Requerida</h2>
            <p className="max-w-md">No se ha detectado una organización válida. Por favor, asegúrese de haber iniciado sesión correctamente.</p>
          </div>
        </div>
      )}
    </div>
  );
}
