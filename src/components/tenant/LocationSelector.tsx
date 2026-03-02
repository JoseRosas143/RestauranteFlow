
'use client';

import React, { useEffect, useState } from 'react';
import { useTenant, useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Location } from '@/lib/types';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MapPin, Store, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LocationSelector() {
  const { orgId, locId, setLoc, allowedLocs } = useTenant();
  const db = useFirestore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocs() {
      if (!orgId) return;
      const locsRef = collection(db, 'orgs', orgId, 'locations');
      const snap = await getDocs(locsRef);
      const allLocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Location));
      setLocations(allLocs.filter(l => allowedLocs.includes(l.id)));
      setLoading(false);
    }
    fetchLocs();
  }, [orgId, allowedLocs, db]);

  if (!orgId) return null;

  if (locId) {
    return (
      <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
        <Store className="h-4 w-4" />
        <span className="text-sm font-bold">{locations.find(l => l.id === locId)?.name || 'Sucursal'}</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setLoc(null)}>Cambiar</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black uppercase italic">Seleccionar Sucursal</CardTitle>
          <CardDescription>Elige el punto de venta donde vas a operar hoy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 opacity-50">Cargando sucursales...</div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-destructive font-bold">No tienes sucursales asignadas.</p>
              <p className="text-xs text-muted-foreground mt-2">Contacta a tu administrador.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {locations.map((loc) => (
                <Button 
                  key={loc.id} 
                  variant="outline" 
                  className="h-20 justify-between text-lg font-bold hover:border-primary hover:bg-primary/5 transition-all group"
                  onClick={() => setLoc(loc)}
                >
                  <div className="text-left">
                    <div>{loc.name}</div>
                    <div className="text-[10px] font-normal text-muted-foreground uppercase">{loc.address || 'Ubicación central'}</div>
                  </div>
                  <ArrowRight className="h-6 w-6 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
