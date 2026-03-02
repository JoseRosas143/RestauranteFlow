'use client';

import React, { useEffect, useState } from 'react';
import { useTenant, useFirestore } from '@/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Location } from '@/lib/types';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MapPin, Store, ArrowRight, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function LocationSelector() {
  const { orgId, locId, setLoc, allowedLocs } = useTenant();
  const db = useFirestore();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchLocs() {
      if (!orgId) {
        setLoading(false);
        return;
      }
      try {
        const locsRef = collection(db, 'orgs', orgId, 'locations');
        const snap = await getDocs(locsRef);
        const allLocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Location));
        
        // Si hay una lista de sucursales permitidas, filtramos. Si está vacía (admin), mostramos todas.
        const filtered = allowedLocs.length > 0 
          ? allLocs.filter(l => allowedLocs.includes(l.id))
          : allLocs;
          
        setLocations(filtered);
      } catch (e) {
        console.error('Error fetching locations:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchLocs();
  }, [orgId, allowedLocs, db]);

  const createDefaultLocation = async () => {
    if (!orgId) {
      toast({ variant: 'destructive', title: "No se encontró el ID de organización" });
      return;
    }
    setCreating(true);
    try {
      const locsRef = collection(db, 'orgs', orgId, 'locations');
      const newLoc = {
        name: 'Sucursal Principal',
        address: 'Dirección por configurar',
        createdAt: Date.now(),
        logo: ''
      };
      const docRef = await addDoc(locsRef, newLoc);
      
      const createdLoc = { id: docRef.id, ...newLoc } as Location;
      setLocations(prev => [...prev, createdLoc]);
      setLoc(createdLoc);
      
      toast({ title: "¡Éxito!", description: "Sucursal inicial creada correctamente." });
    } catch (e: any) {
      console.error('Error creating location:', e);
      toast({ 
        variant: 'destructive', 
        title: "Error al crear sucursal", 
        description: e.message || "Verifique los permisos de Firestore." 
      });
    } finally {
      setCreating(false);
    }
  };

  if (!orgId) return null;

  if (locId) {
    const current = locations.find(l => l.id === locId);
    return (
      <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
        <Store className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold">{current?.name || 'Sucursal'}</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] hover:bg-muted" onClick={() => setLoc(null)}>Cambiar</Button>
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
          <CardTitle className="text-2xl font-black uppercase italic">RestauranteFlow</CardTitle>
          <CardDescription>Seleccione la sucursal donde va a operar hoy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 opacity-50 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-4 w-4" /> Cargando sucursales...
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">No se encontraron sucursales configuradas para su organización.</p>
              <Button onClick={createDefaultLocation} disabled={creating} className="w-full h-12 font-bold">
                {creating ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                Crear Sucursal Inicial
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
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