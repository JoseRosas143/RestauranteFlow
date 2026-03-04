
'use client';

import React, { useEffect, useState } from 'react';
import { useTenant, useFirestore } from '@/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Location } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MapPin, Store, ArrowRight, Plus, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
    if (!orgId) return;
    setCreating(true);
    try {
      const locsRef = collection(db, 'orgs', orgId, 'locations');
      const newLoc = {
        name: locations.length === 0 ? 'Sucursal Principal' : `Sucursal ${locations.length + 1}`,
        address: '',
        createdAt: Date.now(),
        logo: '',
        phoneNumber: '',
        taxRate: 0
      };
      const docRef = await addDoc(locsRef, newLoc);
      const createdLoc = { id: docRef.id, ...newLoc } as Location;
      setLocations(prev => [...prev, createdLoc]);
      setLoc(createdLoc);
      toast({ title: "Sucursal creada" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Error", description: e.message });
    } finally {
      setCreating(false);
    }
  };

  if (!orgId) return null;

  // Si ya hay una locId, mostramos un selector compacto integrado para la cabecera
  if (locId) {
    const current = locations.find(l => l.id === locId);
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-4 border-2 font-black text-primary gap-2 bg-white rounded-xl shadow-sm">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline uppercase text-[10px] tracking-widest">{current?.name || 'SUCURSAL'}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
            <div className="px-2 py-1.5 text-[10px] font-black uppercase text-muted-foreground">Cambiar de Sede</div>
            {locations.map(l => (
              <DropdownMenuItem key={l.id} className="rounded-xl font-bold uppercase text-[10px] py-3 cursor-pointer" onClick={() => setLoc(l)}>
                {l.name} {l.id === locId && "✓"}
              </DropdownMenuItem>
            ))}
            <div className="border-t mt-2 pt-2">
              <DropdownMenuItem className="rounded-xl font-bold uppercase text-[10px] py-3 cursor-pointer text-primary" onClick={createDefaultLocation}>
                <Plus className="h-3 w-3 mr-2" /> Nueva Sucursal
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Pantalla de selección inicial si no hay locId
  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="text-center pt-10 pb-6">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
            <MapPin className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-4xl font-black uppercase italic tracking-tighter text-primary leading-none">RestauranteFlow</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest mt-2">Seleccione su centro de operaciones</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          {loading ? (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin h-10 w-10 text-primary" />
              <p className="font-black text-xs uppercase tracking-widest">Sincronizando Sedes...</p>
            </div>
          ) : locations.length === 0 ? (
            <Button onClick={createDefaultLocation} disabled={creating} className="w-full h-16 text-xl font-black rounded-2xl">
              {creating ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-6 w-6" />}
              CREAR SUCURSAL INICIAL
            </Button>
          ) : (
            <div className="grid gap-4 max-h-[450px] overflow-y-auto pr-2">
              {locations.map((loc) => (
                <Button key={loc.id} variant="outline" className="h-24 justify-between font-black rounded-2xl border-2 px-6" onClick={() => setLoc(loc)}>
                  <div className="text-left flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-lg uppercase italic leading-none">{loc.name}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{loc.address || 'Ubicación central'}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-8 w-8 text-primary" />
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
