"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useCollection, useDoc, useTenant, useMemoFirebase, useAuth } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, setDoc, writeBatch, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Plus, Trash2, Package, Tag, Layers, Percent, Loader2, Save, Edit2, 
  X, ImageIcon, ArrowLeft, Upload, Users, Mail, Phone, MapPin, 
  Star, ShoppingBag, Calendar, Settings, ShieldAlert, Store, RefreshCw, LogOut, Copy, KeyRound
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItem, Category, Modifier, Discount, SoldBy, DiscountType, Customer, LoyaltySettings, UserProfile, Location, UserRole } from '@/lib/types';
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
  
  const categoriesQuery = useMemoFirebase(() => 
    orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'categories'), orderBy('name', 'asc')) : null, 
    [db, orgId, locId]
  );
  
  const modifiersQuery = useMemoFirebase(() => 
    orgId && locId ? collection(db, 'orgs', orgId, 'locations', locId, 'modifiers') : null, 
    [db, orgId, locId]
  );
  
  const discountsQuery = useMemoFirebase(() => 
    orgId && locId ? collection(db, 'orgs', orgId, 'locations', locId, 'discounts') : null, 
    [db, orgId, locId]
  );
  
  const customersQuery = useMemoFirebase(() => 
    orgId ? query(collection(db, 'orgs', orgId, 'customers'), orderBy('name', 'asc')) : null, 
    [db, orgId]
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
  const { data: categories } = useCollection<Category>(categoriesQuery);
  const { data: modifiers } = useCollection<Modifier>(modifiersQuery);
  const { data: discounts } = useCollection<Discount>(discountsQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);
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
            <Store className="h-4 w-4" /> STORE ID: {orgId}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setLoc(null)} className="font-bold border-2">CAMBIAR SUCURSAL</Button>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="font-bold">SALIR</Button>
        </div>
      </header>

      <main className="flex-1 p-8">
        <Tabs defaultValue="articulos" className="space-y-6 max-w-7xl mx-auto">
          <TabsList className="bg-white border shadow-sm w-full h-14 p-1 gap-1">
            <TabsTrigger value="articulos" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Package className="h-4 w-4" /> Artículos</TabsTrigger>
            <TabsTrigger value="clientes" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Users className="h-4 w-4" /> Clientes</TabsTrigger>
            <TabsTrigger value="config" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Settings className="h-4 w-4" /> Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="articulos">
            <ArticulosManager items={items || []} categories={categories || []} orgId={orgId!} locId={locId!} />
          </TabsContent>

          <TabsContent value="clientes">
            <ClientesManager customers={customers || []} orgId={orgId!} />
          </TabsContent>

          <TabsContent value="config">
            <ConfigManager location={currentLocationData || undefined} staff={staffUsers || []} orgId={orgId!} locId={locId!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ... (ArticulosManager y ClientesManager se mantienen similares)
function ArticulosManager({ items, categories, orgId, locId }: { items: MenuItem[], categories: Category[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialItemState: Partial<MenuItem> = { name: '', price: 0, cost: 0, category: '', soldBy: 'unidad', trackInventory: false, inventoryCount: 0, image: '' };
  const [newItem, setNewItem] = useState<Partial<MenuItem>>(initialItemState);

  const saveItem = async () => {
    if (!newItem.name || newItem.price === undefined) return;
    setLoading(true);
    try {
      const path = collection(db, 'orgs', orgId, 'locations', locId, 'menuItems');
      const data = { ...newItem, updatedAt: Date.now() };
      delete (data as any).id;
      if (editingId) await updateDoc(doc(path, editingId), data);
      else await addDoc(path, { ...data, createdAt: Date.now() });
      setNewItem(initialItemState); setEditingId(null);
      toast({ title: "Guardado" });
    } catch (e) { toast({ variant: 'destructive', title: "Error" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-md border-t-4 border-primary">
        <CardHeader><CardTitle className="text-xl font-black">{editingId ? 'Editar' : 'Nuevo'} Artículo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Nombre" />
          <Input type="number" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} placeholder="Precio Venta" />
          <Button className="w-full h-14 font-black" onClick={saveItem} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'GUARDAR'}</Button>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2 shadow-xl"><CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 border-2 rounded-2xl hover:bg-primary/5 transition-all">
            <div className="font-bold">{item.name} (${item.price})</div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => {setNewItem(item); setEditingId(item.id!);}}><Edit2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'locations', locId, 'menuItems', item.id!))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}</div>
      </CardContent></Card>
    </div>
  );
}

function ClientesManager({ customers, orgId }: { customers: Customer[], orgId: string }) {
  return <div className="p-8 text-center opacity-40 italic">Módulo de Clientes en Sincronización...</div>;
}

function ConfigManager({ location, staff, orgId, locId }: { location?: Location, staff: UserProfile[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [locForm, setLocForm] = useState<Partial<Location>>(location || { name: '', address: '', phoneNumber: '', taxRate: 0, logo: '' });
  const [loading, setLoading] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<Partial<UserProfile>>({ name: '', email: '', role: 'cashier', pin: '', allowedLocIds: [locId] });

  useEffect(() => { if (location) setLocForm(location); }, [location]);

  const saveLocationDetails = async () => {
    setLoading(true);
    try {
      const data = { ...locForm, updatedAt: Date.now() };
      delete (data as any).id;
      await updateDoc(doc(db, 'orgs', orgId, 'locations', locId), data);
      toast({ title: "Sucursal Actualizada" });
    } catch (e) { toast({ variant: 'destructive', title: "Error" }); }
    finally { setLoading(false); }
  };

  const saveStaffUser = async () => {
    if (!newUser.name || !newUser.email) return;
    setLoading(true);
    try {
      const path = collection(db, 'orgs', orgId, 'users');
      const data = { ...newUser, orgId, updatedAt: Date.now() };
      delete (data as any).id;
      if (editingStaffId) await updateDoc(doc(path, editingStaffId), data);
      else await addDoc(path, { ...data, uid: `STAFF-${Date.now()}`, createdAt: Date.now() });
      setNewUser({ name: '', email: '', role: 'cashier', pin: '', allowedLocIds: [locId] });
      setEditingStaffId(null);
      toast({ title: "Personal Actualizado" });
    } catch (e) { toast({ variant: 'destructive', title: "Error" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border-t-4 border-primary shadow-xl">
        <CardHeader><CardTitle className="font-black uppercase tracking-tighter">Perfil de Sede</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={locForm.name || ''} onChange={e => setLocForm({...locForm, name: e.target.value})} placeholder="Nombre Comercial" />
          <Input value={locForm.address || ''} onChange={e => setLocForm({...locForm, address: e.target.value})} placeholder="Dirección" />
          <Button className="w-full h-14 font-black" onClick={saveLocationDetails} disabled={loading}>GUARDAR CAMBIOS</Button>
        </CardContent>
      </Card>

      <Card className="border-t-4 border-primary shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="font-black uppercase tracking-tighter">Equipo de Trabajo</CardTitle>
          {editingStaffId && <Button variant="ghost" size="sm" onClick={() => {setEditingStaffId(null); setNewUser({name:'',email:'',role:'cashier',pin:'',allowedLocIds:[locId]});}}><X className="h-4 w-4" /></Button>}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-primary/5 rounded-2xl space-y-3">
            <Input placeholder="Nombre" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} />
            <Input placeholder="Email" value={newUser.email || ''} onChange={e => setNewUser({...newUser, email: e.target.value})} />
            <div className="flex gap-2">
              <Select value={newUser.role} onValueChange={(v: any) => setNewUser({...newUser, role: v})}>
                <SelectTrigger><SelectValue placeholder="Rol" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="cashier">Cajero</SelectItem>
                  <SelectItem value="kitchen">Cocina</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="PIN (4 dig)" maxLength={4} className="pl-9" value={newUser.pin || ''} onChange={e => setNewUser({...newUser, pin: e.target.value})} />
              </div>
            </div>
            <Button className="w-full h-12 font-black" onClick={saveStaffUser} disabled={loading}>{editingStaffId ? 'ACTUALIZAR' : 'CONTRATAR'}</Button>
          </div>
          <ScrollArea className="h-64">
            <div className="space-y-2">{staff.map(u => (
              <div key={u.id} className="flex justify-between items-center p-4 border-2 rounded-2xl bg-white shadow-sm">
                <div>
                  <div className="font-black text-sm">{u.name}</div>
                  <div className="text-[10px] font-bold text-primary uppercase">{u.role} • PIN: {u.pin || '----'}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => {setNewUser(u); setEditingStaffId(u.id!);}}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'users', u.id!))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}</div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
