
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Acceso Exitoso", description: "Iniciando sesión en RestauranteFlow" });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de acceso",
        description: "Credenciales inválidas. Verifique su correo corporativo o ID de tienda."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const firstName = user.displayName?.split(' ')[0] || '';
        const lastName = user.displayName?.split(' ').slice(1).join(' ') || '';
        
        await setDoc(doc(db, 'orgs', user.uid, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: 'admin',
          orgId: user.uid,
          allowedLocIds: [],
          createdAt: Date.now()
        });

        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          firstName,
          lastName,
          email: user.email,
          role: 'Admin',
          branchId: '',
          orgId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        toast({ title: "¡Bienvenido!", description: "Vamos a configurar su restaurante." });
      }
      router.push('/');
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
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 border border-primary/10">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-primary italic uppercase">RestauranteFlow</h1>
          <p className="text-muted-foreground font-medium">Sistema Profesional de Gestión Gastronómica</p>
        </div>

        <Card className="shadow-2xl border-t-4 border-t-primary overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8">
            <CardTitle className="text-xl font-bold">Portal de Acceso</CardTitle>
            <CardDescription>Ingrese sus credenciales de staff o administrador</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeId" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 opacity-50" /> ID de la Tienda (Opcional)
                </Label>
                <Input 
                  id="storeId" 
                  placeholder="Ej: FLOW-001" 
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Corporativo / Usuario</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nombre@restaurante.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              <Button type="submit" className="w-full h-12 font-black text-lg shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : "ENTRAR AL SISTEMA"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground font-bold">Acceso Rápido</span></div>
            </div>

            <Button variant="outline" type="button" className="w-full h-11 font-bold border-2 hover:bg-primary/5" onClick={handleGoogleLogin} disabled={loading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google Workspace
            </Button>
          </CardContent>
          <CardFooter className="bg-muted/20 p-4 border-t flex justify-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Conexión Segura SSL
            </span>
          </CardFooter>
        </Card>
        
        <div className="text-center">
          <Link href="/register" className="text-sm text-primary font-bold hover:underline">
            ¿Desea registrar su negocio? Comience aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
