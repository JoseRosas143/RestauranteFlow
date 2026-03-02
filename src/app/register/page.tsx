
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const generateStoreId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Contraseña corta", description: "Mínimo 6 caracteres." });
      return;
    }
    
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const newStoreId = generateStoreId();
      
      // Crear perfil global
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: email,
        role: 'Admin',
        branchId: '',
        orgId: newStoreId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Inicializar organización
      await setDoc(doc(db, 'orgs', newStoreId), {
        id: newStoreId,
        name: `${name}'s Restaurant`,
        ownerUid: user.uid,
        createdAt: Date.now()
      });

      // Crear usuario dentro de la organización
      await setDoc(doc(db, 'orgs', newStoreId, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: 'admin',
        orgId: newStoreId,
        allowedLocIds: [],
        createdAt: Date.now()
      });

      toast({ 
        title: "¡Bienvenido a RestauranteFlow!", 
        description: `Tu ID de Tienda es: ${newStoreId}. Guárdalo bien.` 
      });
      router.push('/admin');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al registrar", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const newStoreId = generateStoreId();
        const firstName = user.displayName?.split(' ')[0] || '';
        const lastName = user.displayName?.split(' ').slice(1).join(' ') || '';
        
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          firstName,
          lastName,
          email: user.email,
          role: 'Admin',
          branchId: '',
          orgId: newStoreId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        await setDoc(doc(db, 'orgs', newStoreId), {
          id: newStoreId,
          name: `${user.displayName}'s Restaurant`,
          ownerUid: user.uid,
          createdAt: Date.now()
        });
        
        await setDoc(doc(db, 'orgs', newStoreId, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: 'admin',
          orgId: newStoreId,
          allowedLocIds: [],
          createdAt: Date.now()
        });
        
        toast({ title: "¡Bienvenido!", description: `Tu ID de Tienda generado es ${newStoreId}` });
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error con Google", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-background to-background">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-accent rounded-[2rem] overflow-hidden">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Rocket className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="text-3xl font-black text-accent uppercase italic tracking-tighter">Únete al Flujo</CardTitle>
          <CardDescription className="font-bold uppercase text-[10px] tracking-widest mt-2">Crea tu cuenta profesional hoy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase ml-1">Nombre Completo</Label>
              <Input id="name" placeholder="Ej: Mario Rossi" value={name} onChange={(e) => setName(e.target.value)} required className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-accent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase ml-1">Email Corporativo</Label>
              <Input id="email" type="email" placeholder="mario@negocio.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-accent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" dir="ltr" className="text-[10px] font-black uppercase ml-1">Contraseña Segura</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-accent" />
            </div>
            <Button type="submit" className="w-full h-14 font-black text-lg bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20 rounded-xl mt-4" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : "COMENZAR ONBOARDING"}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-background px-4 text-muted-foreground">O vía Google</span></div>
          </div>

          <Button variant="outline" type="button" className="w-full h-12 font-bold border-2 rounded-xl hover:bg-muted/50" onClick={handleGoogleRegister} disabled={loading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Acceso Rápido Google
          </Button>
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 flex flex-col gap-4 border-t">
          <div className="text-sm text-center font-bold text-muted-foreground">
            ¿Ya tiene una cuenta?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Inicie sesión aquí
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2 opacity-50">
            <ShieldCheck className="h-3 w-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Servidores Cifrados SSL</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
