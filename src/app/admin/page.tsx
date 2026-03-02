
"use client"

import AdminDashboard from '@/components/admin/AdminDashboard';
import LocationSelector from '@/components/tenant/LocationSelector';
import { useTenant } from '@/firebase';

export default function AdminPage() {
  const { orgId, locId } = useTenant();
  
  return (
    <>
      <LocationSelector />
      {orgId && locId && <AdminDashboard />}
      {(!orgId || !locId) && (
        <div className="h-screen flex items-center justify-center text-muted-foreground italic">
          Esperando selección de sucursal...
        </div>
      )}
    </>
  );
}
