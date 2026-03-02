
'use client';

import React, { useEffect, useState } from 'react';
import { useTenant, useFirestore } from '@/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Location } from '@/lib/types';
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
        
        const filtered = allowedLocs && allowedLocs.length > 0 
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
        name: locations.length === 0 ? 'Sucursal Principal' : `Sucursal ${locations.length + 1}`,
        address: 'Dirección por configurar',
        createdAt: Date.now(),
        logo: '',
        phoneNumber: '',
        taxRate: 0
      };
      const docRef = await addDoc(locsRef, newLoc);
      
      const createdLoc = { id: docRef.id, ...newLoc } as Location;
      setLocations(prev => [...prev, createdLoc]);
      setLoc(createdLoc);
      
      toast({ title: "¡Éxito!", description: "Sucursal creada correctamente." });
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

  // Si no hay orgId, no mostramos nada para evitar el pantallazo blanco,
  // pero el AdminPage manejará el error visual.
  if (!orgId) return null;

  if (locId) {
    const current = locations.find(l => l.id === locId);
    return (
      <div className="fixed top-4 right-4 z-[60] flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border-2 border-primary/20 shadow-xl group hover:border-primary transition-all">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Store className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-muted-foreground leading-none">Sucursal Activa</span>
          <span className="text-sm font-black tracking-tight">{current?.name || 'Sincronizando...'}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-black uppercase hover:bg-primary hover:text-white rounded-xl" onClick={() => setLoc(null)}>Cambiar</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="text-center pt-10 pb-6">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <MapPin className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-4xl font-black uppercase italic tracking-tighter text-primary leading-none">RestauranteFlow</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest mt-2">Seleccione su centro de operaciones</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          {loading ? (
            <div className="text-center py-12 opacity-50 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin h-10 w-10 text-primary" />
              <p className="font-black text-xs uppercase tracking-widest">Sincronizando Sedes...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8 space-y-6">
              <p className="text-muted-foreground font-medium">Bienvenido a RestauranteFlow. Para comenzar, cree su primera sucursal física o virtual.</p>
              <Button onClick={createDefaultLocation} disabled={creating} className="w-full h-16 text-xl font-black shadow-2xl rounded-2xl transition-transform active:scale-95">
                {creating ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-6 w-6" />}
                CREAR SUCURSAL INICIAL
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {locations.map((loc) => (
                <Button 
                  key={loc.id} 
                  variant="outline" 
                  className="h-24 justify-between text-xl font-black hover:border-primary hover:bg-primary/5 transition-all group rounded-2xl border-2 px-6"
                  onClick={() => setLoc(loc)}
                >
                  <div className="text-left flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Store className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <div className="leading-none">{loc.name}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{loc.address || 'Ubicación central'}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                </Button>
              ))}
              <Button 
                variant="ghost" 
                onClick={createDefaultLocation} 
                disabled={creating} 
                className="h-16 border-2 border-dashed border-primary/20 text-primary font-black uppercase hover:bg-primary/5 rounded-2xl"
              >
                {creating ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-5 w-5" />}
                Agregar Otra Sucursal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
