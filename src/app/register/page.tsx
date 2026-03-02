
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
import { Rocket, Loader2, Store } from 'lucide-react';
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Contraseña corta", description: "Mínimo 6 caracteres." });
      return;
    }
    
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Crear perfil de usuario en Firestore (Modo Multi-Tenant)
      // La propia UID del usuario será su orgId inicial por simplicidad en el onboarding
      await setDoc(doc(db, 'orgs', user.uid, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: 'admin',
        orgId: user.uid,
        allowedLocIds: [], // Se llenará tras crear la primera sucursal
        createdAt: Date.now()
      });

      // También guardar en el path global de usuarios para las reglas de seguridad
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: email,
        role: 'Admin',
        branchId: '', // Se llenará en onboarding
        orgId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast({ 
        title: "¡Registro exitoso!", 
        description: "Redirigiendo para configurar su primer restaurante." 
      });
      
      // Redirigir al panel de administración para el onboarding
      router.push('/admin');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error al registrar",
        description: error.message || "No se pudo crear la cuenta."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-background to-background">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-accent">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Rocket className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold text-accent">Crea tu Cuenta</CardTitle>
          <CardDescription>Comienza hoy mismo con RestauranteFlow</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input 
                id="name" 
                placeholder="Juan Pérez" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="juan@negocio.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña (min. 6 caracteres)</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button type="submit" variant="default" className="w-full h-11 font-bold bg-accent hover:bg-accent/90" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Comenzar Onboarding"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            ¿Ya tiene una cuenta?{" "}
            <Link href="/login" className="text-accent font-bold hover:underline">
              Inicie sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
