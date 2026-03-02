
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { generateWelcomeEmail } from '@/ai/flows/welcome-email-flow';

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
      // Para la primera tienda demo, usaremos 143001 si está libre o generaremos uno.
      // Aquí generamos uno aleatorio de 6 dígitos para cumplir con la arquitectura comercial.
      const newStoreId = generateStoreId();
      
      // Crear perfil global
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: email,
        role: 'admin',
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

      // Envío de correo de bienvenida (simulado)
      try {
        const emailContent = await generateWelcomeEmail({
          userName: name,
          userEmail: email,
          storeId: newStoreId,
          password: password
        });
        console.log("SIMULATED WELCOME EMAIL:", emailContent);
        toast({ 
          title: "¡Bienvenido a bordo!", 
          description: `Tu ID de Tienda es ${newStoreId}. Revisa tu consola para ver el correo de bienvenida.` 
        });
      } catch (err) {
        console.error("Email simulation failed", err);
      }

      router.push('/admin');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al registrar", description: error.message });
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
