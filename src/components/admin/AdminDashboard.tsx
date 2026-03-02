
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useCollection, useDoc, useTenant, useMemoFirebase, useAuth } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Plus, Trash2, Package, Loader2, Edit2, 
  X, ArrowLeft, Users, Settings, Store, LogOut, KeyRound, Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItem, UserProfile, Location } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { orgId, locId, setLoc } = useTenant();
  const { toast } = useToast();

  const itemsQuery = useMemoFirebase(() => 
    orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'menuItems'), orderBy('name', 'asc')) : null, 
    [db, orgId, locId]
  );
  
  const usersQuery = useMemoFirebase(() => 
    orgId ? collection(db, 'orgs', orgId, 'users') : null, 
    [db, orgId]
  );
  
  const locationDocRef = useMemoFirebase(() => 
    orgId && locId ? doc(db, 'orgs', orgId, 'locations', locId) : null, 
    [db, orgId, locId]
  );

  const { data: items } = useCollection<MenuItem>(itemsQuery);
  const { data: staffUsers } = useCollection<UserProfile>(usersQuery);
  const { data: currentLocationData } = useDoc<Location>(locationDocRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al cerrar sesión' });
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-white border-b px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/')}>
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="flex items-center gap-3">
             {currentLocationData?.logo && <img src={currentLocationData.logo} className="h-10 w-10 rounded-md object-cover border" alt="Logo" />}
             <div>
                <h1 className="text-2xl font-black text-primary italic uppercase tracking-tighter leading-none">RestauranteFlow</h1>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{currentLocationData?.name || 'Administración'}</p>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-9 px-4 border-2 font-black text-primary gap-2">
            <Store className="h-4 w-4" /> STORE ID: {orgId || '000000'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setLoc(null)} className="font-bold border-2">CAMBIAR SUCURSAL</Button>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="font-bold gap-2">
            <LogOut className="h-4 w-4" /> SALIR
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8">
        <Tabs defaultValue="articulos" className="space-y-6 max-w-7xl mx-auto">
          <TabsList className="bg-white border shadow-sm w-full h-14 p-1 gap-1">
            <TabsTrigger value="articulos" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter"><Package className="h-4 w-4" /> Artículos</TabsTrigger>
            <TabsTrigger value="personal" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter"><Users className="h-4 w-4" /> Mi Equipo</TabsTrigger>
            <TabsTrigger value="config" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter"><Settings className="h-4 w-4" /> Ajustes</TabsTrigger>
          </TabsList>

          <TabsContent value="articulos">
            <ArticulosManager items={items || []} orgId={orgId!} locId={locId!} />
          </TabsContent>

          <TabsContent value="personal">
            <StaffManager staff={staffUsers || []} orgId={orgId!} locId={locId!} />
          </TabsContent>

          <TabsContent value="config">
            <ConfigManager location={currentLocationData || undefined} orgId={orgId!} locId={locId!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ArticulosManager({ items, orgId, locId }: { items: MenuItem[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialItemState: Partial<MenuItem> = { name: '', price: 0, cost: 0, category: 'General' };
  const [newItem, setNewItem] = useState<Partial<MenuItem>>(initialItemState);

  const saveItem = async () => {
    if (!newItem.name || newItem.price === undefined) {
      toast({ variant: 'destructive', title: 'Faltan datos', description: 'Nombre y precio son obligatorios.' });
      return;
    }
    setLoading(true);
    try {
      const path = collection(db, 'orgs', orgId, 'locations', locId, 'menuItems');
      const data = { ...newItem, updatedAt: Date.now() };
      delete (data as any).id;
      if (editingId) await updateDoc(doc(path, editingId), data);
      else await addDoc(path, { ...data, createdAt: Date.now() });
      setNewItem(initialItemState); 
      setEditingId(null);
      toast({ title: "Artículo Guardado" });
    } catch (e) { toast({ variant: 'destructive', title: "Error al guardar artículo" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-md border-t-4 border-primary rounded-2xl">
        <CardHeader><CardTitle className="text-xl font-black uppercase italic tracking-tighter">{editingId ? 'Editar' : 'Nuevo'} Artículo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase ml-1">Nombre del Producto</Label>
            <Input value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Ej: Hamburguesa Clásica" className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase ml-1">Precio de Venta ($)</Label>
            <Input type="number" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} placeholder="0.00" className="h-12 rounded-xl" />
          </div>
          <Button className="w-full h-14 font-black text-lg mt-4" onClick={saveItem} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'GUARDAR ARTÍCULO'}</Button>
          {editingId && <Button variant="ghost" className="w-full" onClick={() => {setEditingId(null); setNewItem(initialItemState);}}>Cancelar Edición</Button>}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2 shadow-xl rounded-2xl overflow-hidden"><CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 border-2 rounded-2xl hover:bg-primary/5 transition-all group">
            <div>
              <div className="font-black text-lg leading-tight uppercase italic">{item.name}</div>
              <div className="text-primary font-bold text-sm tracking-tighter">${item.price.toFixed(2)}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10" onClick={() => {setNewItem(item); setEditingId(item.id!);}}><Edit2 className="h-4 w-4 text-primary" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10 text-destructive" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'locations', locId, 'menuItems', item.id!))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}</div>
      </CardContent></Card>
    </div>
  );
}

function StaffManager({ staff, orgId, locId }: { staff: UserProfile[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const initialStaffState: Partial<UserProfile> = { name: '', email: '', role: 'cashier', pin: '', allowedLocIds: [locId] };
  const [newUser, setNewUser] = useState<Partial<UserProfile>>(initialStaffState);

  const saveStaffUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.pin) {
      toast({ variant: 'destructive', title: 'Faltan datos', description: 'Nombre, Email y PIN son obligatorios.' });
      return;
    }
    setLoading(true);
    try {
      const path = collection(db, 'orgs', orgId, 'users');
      const data = { ...newUser, orgId, updatedAt: Date.now() };
      delete (data as any).id;
      if (editingId) await updateDoc(doc(path, editingId), data);
      else await addDoc(path, { ...data, uid: `STAFF-${Date.now()}`, createdAt: Date.now() });
      setNewUser(initialStaffState);
      setEditingId(null);
      toast({ title: "Personal Actualizado" });
    } catch (e) { toast({ variant: 'destructive', title: "Error al guardar empleado" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border-t-4 border-primary shadow-xl rounded-2xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="font-black uppercase tracking-tighter italic text-2xl">{editingId ? 'Editar Colaborador' : 'Contratar Personal'}</CardTitle>
          {editingId && <Button variant="ghost" size="sm" onClick={() => {setEditingId(null); setNewUser(initialStaffState);}}><X className="h-4 w-4" /></Button>}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-primary/5 rounded-[2rem] space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase ml-1">Nombre Completo</Label>
              <Input placeholder="Ej: Mario Rossi" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} className="h-12 rounded-xl bg-white border-0" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase ml-1">Email de Acceso</Label>
              <Input placeholder="mario@tienda.com" value={newUser.email || ''} onChange={e => setNewUser({...newUser, email: e.target.value})} className="h-12 rounded-xl bg-white border-0" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-1">Rol en Tienda</Label>
                <Select value={newUser.role} onValueChange={(v: any) => setNewUser({...newUser, role: v})}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-0"><SelectValue placeholder="Rol" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="cashier">Cajero</SelectItem>
                    <SelectItem value="kitchen">Cocina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-1">PIN de Acceso (4 dígitos)</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input placeholder="Ej: 1234" maxLength={4} className="pl-9 h-12 rounded-xl bg-white border-0 font-black tracking-widest" value={newUser.pin || ''} onChange={e => setNewUser({...newUser, pin: e.target.value})} />
                </div>
              </div>
            </div>
            <Button className="w-full h-14 font-black text-lg shadow-xl shadow-primary/20 rounded-2xl" onClick={saveStaffUser} disabled={loading}>{editingId ? 'ACTUALIZAR DATOS' : 'DAR DE ALTA'}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-t-4 border-primary shadow-xl rounded-2xl">
        <CardHeader><CardTitle className="font-black uppercase tracking-tighter italic text-2xl">Mi Equipo de Trabajo</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px] pr-2">
            <div className="space-y-3">{staff.map(u => (
              <div key={u.id} className="flex justify-between items-center p-4 border-2 rounded-2xl bg-white shadow-sm hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary uppercase">
                    {u.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-black text-base leading-none uppercase">{u.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge variant="secondary" className="text-[10px] font-black uppercase">{u.role}</Badge>
                       <span className="text-[10px] text-muted-foreground font-bold tracking-widest">PIN: {u.pin || '----'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => {setNewUser(u); setEditingId(u.id!);}}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive rounded-full" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'users', u.id!))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}</div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigManager({ location, orgId, locId }: { location?: Location, orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [locForm, setLocForm] = useState<Partial<Location>>(location || { name: '', address: '', phoneNumber: '', taxRate: 0, logo: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (location) setLocForm(location); }, [location]);

  const saveLocationDetails = async () => {
    setLoading(true);
    try {
      const data = { ...locForm, updatedAt: Date.now() };
      delete (data as any).id;
      await updateDoc(doc(db, 'orgs', orgId, 'locations', locId), data);
      toast({ title: "Sucursal Actualizada" });
    } catch (e) { toast({ variant: 'destructive', title: "Error al actualizar sucursal" }); }
    finally { setLoading(false); }
  };

  return (
    <Card className="border-t-4 border-primary shadow-xl rounded-2xl max-w-2xl mx-auto">
      <CardHeader><CardTitle className="font-black uppercase tracking-tighter italic text-2xl">Ajustes de la Sede</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase ml-1">Nombre Comercial de la Sucursal</Label>
          <Input value={locForm.name || ''} onChange={e => setLocForm({...locForm, name: e.target.value})} placeholder="Ej: Sucursal Centro" className="h-12 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase ml-1">Dirección Física</Label>
          <Input value={locForm.address || ''} onChange={e => setLocForm({...locForm, address: e.target.value})} placeholder="Calle Falsa 123" className="h-12 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase ml-1">Teléfono / WhatsApp</Label>
            <Input value={locForm.phoneNumber || ''} onChange={e => setLocForm({...locForm, phoneNumber: e.target.value})} placeholder="+54 11..." className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase ml-1">Tasa de Impuesto (%)</Label>
            <Input type="number" value={locForm.taxRate || 0} onChange={e => setLocForm({...locForm, taxRate: Number(e.target.value)})} placeholder="0.00" className="h-12 rounded-xl" />
          </div>
        </div>
        <Button className="w-full h-16 font-black text-xl shadow-2xl shadow-primary/20 rounded-2xl mt-4" onClick={saveLocationDetails} disabled={loading}>GUARDAR CAMBIOS</Button>
      </CardContent>
    </Card>
  );
}
