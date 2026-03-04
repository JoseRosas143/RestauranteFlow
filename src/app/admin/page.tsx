
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import LocationSelector from '@/components/tenant/LocationSelector';
import { useTenant, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { ShieldAlert, Loader2, Home, RefreshCw, KeyRound, Lock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function AdminPage() {
  const { orgId, locId } = useTenant();
  const { user, isUserLoading, profile } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handlePinSubmit = async () => {
    if (pinInput.length !== 4) return;
    setIsValidating(true);
    
    try {
      if (profile?.pin === pinInput) {
        setIsAuthorized(true);
        toast({ title: "Acceso Concedido", description: "Identidad verificada como Dueño." });
        setIsValidating(false);
        return;
      }

      if (orgId) {
        const staffRef = collection(db, 'orgs', orgId, 'users');
        const q = query(staffRef, where('pin', '==', pinInput));
        const querySnapshot = await getDocs(q);
        
        const authorizedStaff = querySnapshot.docs.find(doc => {
          const data = doc.data();
          return data.role === 'admin' || data.role === 'manager';
        });

        if (authorizedStaff) {
          setIsAuthorized(true);
          toast({ title: "Acceso Concedido", description: `Identidad verificada: ${authorizedStaff.data().name}` });
          setIsValidating(false);
          return;
        }
      }

      toast({ variant: "destructive", title: "PIN Incorrecto", description: "No tiene permisos de Administrador o Gerente." });
      setPinInput('');
    } catch (error) {
      console.error("Error validating PIN:", error);
      toast({ variant: "destructive", title: "Error de Seguridad", description: "No se pudo verificar la identidad." });
    } finally {
      setIsValidating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-12 w-12 text-primary" />
          <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Verificando Seguridad...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAuthorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
        <Card className="w-full max-sm bg-zinc-900 border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto border-2 border-primary/40">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Administración</h1>
              <p className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase mt-2">PIN DE SEGURIDAD</p>
            </div>
            <div className="flex justify-center gap-3 text-4xl font-black tracking-widest text-primary h-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-12 border-b-4 border-zinc-700 pb-2">
                  {pinInput[i] ? '•' : ''}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((val) => (
                <Button key={val} variant="outline" className="h-16 text-2xl font-black rounded-2xl border-white/5 bg-zinc-800/50 hover:bg-primary transition-all active:scale-90"
                  disabled={isValidating}
                  onClick={() => {
                    if (val === 'C') setPinInput('');
                    else if (val === 'OK') handlePinSubmit();
                    else if (pinInput.length < 4) setPinInput(prev => prev + (val.toString()));
                  }}
                >{val === 'OK' && isValidating ? <Loader2 className="animate-spin h-6 w-6" /> : val}</Button>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-4">
               <Button variant="ghost" className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest" onClick={() => router.push('/')}>Volver al Inicio</Button>
               <Button variant="ghost" className="text-destructive/50 font-bold uppercase text-[10px] tracking-widest" onClick={handleLogout}>Cerrar Sesión</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b px-8 py-2 flex justify-end sticky top-0 z-[60]">
         <LocationSelector />
      </header>
      {orgId && locId && <AdminDashboard />}
      {orgId && !locId && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="animate-bounce"><ShieldAlert className="h-20 w-20 text-primary/20" /></div>
          <div>
            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tighter italic">Seleccione una Sucursal</h2>
            <p className="max-w-md mx-auto font-bold opacity-60">Use el selector de arriba para comenzar la gestión de su negocio.</p>
          </div>
        </div>
      )}
    </div>
  );
}
