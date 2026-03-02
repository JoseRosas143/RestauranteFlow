
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, Loader2, ShieldCheck, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const syncUserProfile = async (user: any, targetStoreId: string) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let finalOrgId = targetStoreId;

      if (!userDoc.exists()) {
        const newUser = {
          id: user.uid,
          uid: user.uid,
          email: user.email,
          role: 'admin',
          orgId: targetStoreId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newUser);
      } else {
        const data = userDoc.data();
        if (!data.orgId) {
          await updateDoc(userDocRef, { orgId: targetStoreId, updatedAt: new Date().toISOString() });
        } else {
          finalOrgId = data.orgId;
        }
      }

      // Aseguramos que la organización exista siempre
      const orgDocRef = doc(db, 'orgs', finalOrgId);
      const orgDoc = await getDoc(orgDocRef);
      if (!orgDoc.exists()) {
        await setDoc(orgDocRef, {
          id: finalOrgId,
          name: 'Mi Restaurante',
          ownerUid: user.uid,
          createdAt: Date.now()
        });
      }

      return { orgId: finalOrgId };
    } catch (error: any) {
      console.error("Error in syncUserProfile:", error);
      throw error;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || storeId.length !== 6) {
      toast({ variant: "destructive", title: "Store ID Inválido", description: "Ingrese su código de tienda de 6 dígitos." });
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await syncUserProfile(user, storeId);
      
      toast({ title: "Acceso Exitoso", description: "Iniciando sesión..." });
      router.push('/admin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de acceso",
        description: error.message || "Credenciales inválidas."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!storeId || storeId.length !== 6) {
      toast({ variant: "destructive", title: "Store ID Obligatorio", description: "Ingrese su ID de 6 dígitos antes de entrar con Google." });
      return;
    }
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(result.user, storeId);
      router.push('/admin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error con Google",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-6 border border-primary/10">
            <Store className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-primary italic uppercase leading-none">RestauranteFlow</h1>
          <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.2em] opacity-60">Professional POS Systems</p>
        </div>

        <Card className="shadow-2xl border-t-4 border-t-primary rounded-[2.5rem] overflow-hidden border-0">
          <CardHeader className="bg-muted/30 pb-8 text-center pt-10">
            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Portal de Acceso</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Ingrese el ID de su negocio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-10 px-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="storeId" className="flex items-center gap-2 text-[10px] font-black uppercase text-primary ml-1">
                  <Building2 className="h-3 w-3" /> ID DE TIENDA (6 DÍGITOS) *
                </Label>
                <Input 
                  id="storeId" 
                  placeholder="Ej: 143001" 
                  value={storeId}
                  maxLength={6}
                  onChange={(e) => setStoreId(e.target.value)}
                  required
                  className="bg-muted/50 h-14 rounded-2xl border-0 focus-visible:ring-primary font-black text-center text-2xl tracking-[0.2em] px-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase ml-1">Email / Usuario</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nombre@tienda.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="h-14 rounded-2xl bg-muted/20 border-0 focus-visible:ring-primary font-bold px-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" dir="ltr" className="text-[10px] font-black uppercase ml-1">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="h-14 rounded-2xl bg-muted/20 border-0 focus-visible:ring-primary font-bold px-6"
                />
              </div>

              <Button type="submit" className="w-full h-16 font-black text-xl shadow-2xl shadow-primary/20 rounded-2xl" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : "ENTRAR AL SISTEMA"}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-background px-4 text-muted-foreground">Acceso Corporativo</span></div>
            </div>

            <Button variant="outline" type="button" className="w-full h-14 font-black border-2 rounded-2xl" onClick={handleGoogleLogin} disabled={loading}>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google Workspace
            </Button>
          </CardContent>
          <CardFooter className="bg-muted/20 p-6 border-t flex flex-col items-center gap-3">
            <span className="text-[10px] text-muted-foreground flex items-center gap-2 font-black uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3 text-primary" /> Conexión Segura Cifrada
            </span>
          </CardFooter>
        </Card>
        
        <div className="text-center">
          <Link href="/register" className="text-sm text-primary font-black hover:underline uppercase italic tracking-tighter">
            ¿Desea registrar su negocio? Comience aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
