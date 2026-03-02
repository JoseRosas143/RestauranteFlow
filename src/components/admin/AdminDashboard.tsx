
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useDoc, useTenant, useMemoFirebase, useAuth } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Plus, Trash2, Package, Loader2, Edit2, 
  X, ArrowLeft, Users, Settings, Store, LogOut, KeyRound, 
  Tag, Image as ImageIcon, ClipboardList, Receipt, ChevronRight, Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItem, UserProfile, Location, Category } from '@/lib/types';
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
  const { data: staffUsers } = useCollection<UserProfile>(usersQuery);
  const { data: currentLocationData } = useDoc<Location>(locationDocRef);

  useEffect(() => { setMounted(true); }, []);

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
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      <header className="bg-white border-b px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/')}>
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="flex items-center gap-3">
             {currentLocationData?.logo ? (
               <img src={currentLocationData.logo} className="h-10 w-10 rounded-xl object-cover border-2 border-primary/20" alt="Logo" />
             ) : (
               <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border-2 border-primary/20">
                 <Store className="h-5 w-5 text-primary" />
               </div>
             )}
             <div>
                <h1 className="text-2xl font-black text-primary italic uppercase tracking-tighter leading-none">RestauranteFlow</h1>
                <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase">{currentLocationData?.name || 'ADMINISTRACIÓN CENTRAL'}</p>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-9 px-4 border-2 font-black text-primary gap-2 bg-white">
            <Tag className="h-4 w-4" /> STORE ID: {orgId || '000000'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setLoc(null)} className="font-black border-2 rounded-xl">CAMBIAR SEDE</Button>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="font-black gap-2 rounded-xl px-6">
            <LogOut className="h-4 w-4" /> SALIR
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8">
        <Tabs defaultValue="menu" className="space-y-6 max-w-7xl mx-auto">
          <TabsList className="bg-white border-2 shadow-sm w-full h-16 p-2 gap-2 rounded-[1.25rem]">
            <TabsTrigger value="menu" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl"><Package className="h-4 w-4" /> Catálogo</TabsTrigger>
            <TabsTrigger value="personal" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl"><Users className="h-4 w-4" /> Equipo</TabsTrigger>
            <TabsTrigger value="config" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl"><Settings className="h-4 w-4" /> Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1 rounded-[1.5rem] border-2 border-t-8 border-t-primary shadow-lg overflow-hidden h-fit">
                   <CardHeader className="bg-muted/30"><CardTitle className="text-lg font-black uppercase italic">Categorías</CardTitle></CardHeader>
                   <CardContent className="pt-6 space-y-4">
                      <CategoriesManager categories={categories || []} orgId={orgId!} locId={locId!} />
                   </CardContent>
                </Card>
                <div className="md:col-span-3 space-y-6">
                   <ArticulosManager items={items || []} categories={categories || []} orgId={orgId!} locId={locId!} />
                </div>
             </div>
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

function CategoriesManager({ categories, orgId, locId }: { categories: Category[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [newName, setNewName] = useState('');

  const addCategory = async () => {
    if (!newName) return;
    try {
      await addDoc(collection(db, 'orgs', orgId, 'locations', locId, 'categories'), { name: newName });
      setNewName('');
      toast({ title: "Categoría agregada" });
    } catch (e) { toast({ variant: 'destructive', title: "Error" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Nueva categoría" value={newName} onChange={e => setNewName(e.target.value)} className="h-10 rounded-xl" />
        <Button size="icon" onClick={addCategory} className="rounded-xl"><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex justify-between items-center p-3 bg-white border-2 rounded-xl group">
             <span className="font-bold text-sm">{cat.name}</span>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'locations', locId, 'categories', cat.id!))}>
                <Trash2 className="h-4 w-4" />
             </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticulosManager({ items, categories, orgId, locId }: { items: MenuItem[], categories: Category[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialItemState: Partial<MenuItem> = { 
    name: '', price: 0, cost: 0, category: '', 
    trackInventory: false, inventoryCount: 0, 
    soldBy: 'unidad', tpvColor: '#B8732E', tpvShape: 'cuadrado',
    modifiers: []
  };
  const [newItem, setNewItem] = useState<Partial<MenuItem>>(initialItemState);
  const [modInput, setModInput] = useState('');

  const saveItem = async () => {
    if (!newItem.name || !newItem.category) {
      toast({ variant: 'destructive', title: 'Faltan datos', description: 'Nombre y categoría son obligatorios.' });
      return;
    }
    setLoading(true);
    try {
      const path = collection(db, 'orgs', orgId, 'locations', locId, 'menuItems');
      const data = { 
        ...newItem, 
        updatedAt: Date.now(),
        price: Number(newItem.price) || 0,
        cost: Number(newItem.cost) || 0,
        inventoryCount: Number(newItem.inventoryCount) || 0
      };
      delete (data as any).id;
      if (editingId) await updateDoc(doc(path, editingId), data);
      else await addDoc(path, { ...data, createdAt: Date.now() });
      
      setNewItem(initialItemState); 
      setEditingId(null);
      toast({ title: "Artículo Guardado" });
    } catch (e) { toast({ variant: 'destructive', title: "Error al guardar" }); }
    finally { setLoading(false); }
  };

  const addModifier = () => {
    if (!modInput) return;
    setNewItem({ ...newItem, modifiers: [...(newItem.modifiers || []), modInput] });
    setModInput('');
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.5rem] border-2 border-t-8 border-t-primary shadow-lg">
        <CardHeader><CardTitle className="text-xl font-black uppercase italic tracking-tighter">{editingId ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="space-y-4">
              <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase ml-1">Nombre Comercial</Label>
                 <Input value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Ej: Choripán Clásico" className="h-12 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase ml-1">Venta ($)</Label>
                    <Input type="number" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} placeholder="0.00" className="h-12 rounded-xl" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase ml-1">Costo ($)</Label>
                    <Input type="number" value={newItem.cost || ''} onChange={e => setNewItem({...newItem, cost: Number(e.target.value)})} placeholder="0.00" className="h-12 rounded-xl" />
                 </div>
              </div>
              <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase ml-1">Categoría</Label>
                 <Select value={newItem.category} onValueChange={v => setNewItem({...newItem, category: v})}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                       {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                 </Select>
              </div>
           </div>

           <div className="space-y-4">
              <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase ml-1">Imagen URL (Opcional)</Label>
                 <div className="flex gap-2">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border-2"><ImageIcon className="h-5 w-5 opacity-20" /></div>
                    <Input value={newItem.image || ''} onChange={e => setNewItem({...newItem, image: e.target.value})} placeholder="https://..." className="h-12 rounded-xl flex-1" />
                 </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl">
                 <div className="flex-1 space-y-1">
                    <Label className="text-[10px] font-black uppercase">Controlar Stock</Label>
                    <Select value={newItem.trackInventory ? 'yes' : 'no'} onValueChange={v => setNewItem({...newItem, trackInventory: v === 'yes'})}>
                       <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="yes">Activo</SelectItem>
                          <SelectItem value="no">Inactivo</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="w-24 space-y-1">
                    <Label className="text-[10px] font-black uppercase">Cantidad</Label>
                    <Input type="number" disabled={!newItem.trackInventory} value={newItem.inventoryCount || 0} onChange={e => setNewItem({...newItem, inventoryCount: Number(e.target.value)})} className="h-10 rounded-xl" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase ml-1">Vendido por</Label>
                    <Select value={newItem.soldBy} onValueChange={(v: any) => setNewItem({...newItem, soldBy: v})}>
                       <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="unidad">Unidad</SelectItem>
                          <SelectItem value="peso">Peso (kg)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase ml-1">Color TPV</Label>
                    <Input type="color" value={newItem.tpvColor} onChange={e => setNewItem({...newItem, tpvColor: e.target.value})} className="h-12 w-full rounded-xl cursor-pointer" />
                 </div>
              </div>
           </div>

           <div className="space-y-4 border-l pl-6">
              <Label className="text-[10px] font-black uppercase ml-1">Modificadores (Extras)</Label>
              <div className="flex gap-2">
                 <Input placeholder="Ej: Sin cebolla" value={modInput} onChange={e => setModInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addModifier()} className="h-10 rounded-xl" />
                 <Button onClick={addModifier} size="sm" variant="secondary" className="rounded-xl">AGREGAR</Button>
              </div>
              <ScrollArea className="h-24 border-2 rounded-xl p-2 bg-white">
                 <div className="flex flex-wrap gap-2">
                    {newItem.modifiers?.map((mod, i) => (
                      <Badge key={i} className="bg-primary/10 text-primary border-primary/20 gap-1 pr-1 font-bold">
                        {mod}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setNewItem({...newItem, modifiers: newItem.modifiers?.filter((_, idx) => idx !== i)})} />
                      </Badge>
                    ))}
                 </div>
              </ScrollArea>
              <Button className="w-full h-14 font-black text-lg shadow-xl shadow-primary/20 mt-2 rounded-2xl" onClick={saveItem} disabled={loading}>
                 {loading ? <Loader2 className="animate-spin" /> : editingId ? 'ACTUALIZAR ARTÍCULO' : 'CREAR ARTÍCULO'}
              </Button>
              {editingId && <Button variant="ghost" className="w-full font-bold" onClick={() => {setEditingId(null); setNewItem(initialItemState);}}>CANCELAR</Button>}
           </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {items.map(item => (
           <Card key={item.id} className="rounded-2xl border-2 hover:border-primary transition-all group overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                 <div className="w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted flex items-center justify-center"><ImageIcon className="h-6 w-6 opacity-10" /></div>}
                 </div>
                 <div className="flex-1 overflow-hidden">
                    <h3 className="font-black text-lg leading-none uppercase italic truncate">{item.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.category}</p>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-primary font-black text-lg">${item.price.toFixed(2)}</span>
                       {item.trackInventory && <Badge variant="secondary" className="text-[9px] font-black">{item.inventoryCount} STK</Badge>}
                    </div>
                 </div>
                 <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10" onClick={() => {setNewItem(item); setEditingId(item.id!); window.scrollTo({top: 0, behavior: 'smooth'});}}><Edit2 className="h-4 w-4 text-primary" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/10 text-destructive" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'locations', locId, 'menuItems', item.id!))}><Trash2 className="h-4 w-4" /></Button>
                 </div>
              </div>
           </Card>
         ))}
      </div>
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
      toast({ variant: 'destructive', title: 'Faltan datos', description: 'Nombre, Email y PIN son requeridos.' });
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
      toast({ title: "Staff actualizado correctamente" });
    } catch (e) { toast({ variant: 'destructive', title: "Error al guardar" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border-t-8 border-t-primary shadow-xl rounded-[2rem] overflow-hidden border-2">
        <CardHeader className="bg-muted/30"><CardTitle className="font-black uppercase italic tracking-tighter text-2xl">{editingId ? 'EDITAR COLABORADOR' : 'ALTA DE PERSONAL'}</CardTitle></CardHeader>
        <CardContent className="space-y-6 pt-8">
           <div className="space-y-4">
              <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase ml-1">Nombre Completo</Label>
                 <Input placeholder="Ej: Mario Rossi" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase ml-1">Correo Electrónico</Label>
                 <Input placeholder="mario@tienda.com" value={newUser.email || ''} onChange={e => setNewUser({...newUser, email: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase ml-1">Rol Operativo</Label>
                    <Select value={newUser.role} onValueChange={(v: any) => setNewUser({...newUser, role: v})}>
                       <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Rol" /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="manager">Gerente / Encargado</SelectItem>
                          <SelectItem value="cashier">Cajero / POS</SelectItem>
                          <SelectItem value="kitchen">Cocinero / KDS</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase ml-1">PIN POS (4 dígitos)</Label>
                    <div className="relative">
                       <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                       <Input placeholder="1234" maxLength={4} value={newUser.pin || ''} onChange={e => setNewUser({...newUser, pin: e.target.value})} className="pl-10 h-12 rounded-xl font-black tracking-widest" />
                    </div>
                 </div>
              </div>
              <Button className="w-full h-16 font-black text-xl shadow-2xl shadow-primary/20 rounded-2xl" onClick={saveStaffUser} disabled={loading}>{editingId ? 'ACTUALIZAR DATOS' : 'VINCULAR A LA SEDE'}</Button>
              {editingId && <Button variant="ghost" className="w-full font-bold" onClick={() => {setEditingId(null); setNewUser(initialStaffState);}}>CANCELAR</Button>}
           </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-2 shadow-xl h-fit overflow-hidden">
        <CardHeader className="bg-primary/5"><CardTitle className="font-black uppercase italic tracking-tighter text-2xl">EQUIPO ACTIVO</CardTitle></CardHeader>
        <CardContent className="pt-6">
           <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-3">
                 {staff.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-4 border-2 rounded-[1.25rem] bg-white group hover:border-primary transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xl border-2 border-primary/20">{u.name?.charAt(0) || 'U'}</div>
                          <div>
                             <h4 className="font-black text-lg uppercase leading-none">{u.name}</h4>
                             <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-[9px] font-black uppercase px-2">{u.role}</Badge>
                                <span className="text-[10px] font-bold text-muted-foreground">PIN: {u.pin || '----'}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => {setNewUser(u); setEditingId(u.id!);}}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive rounded-full" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'users', u.id!))}><Trash2 className="h-4 w-4" /></Button>
                       </div>
                    </div>
                 ))}
              </div>
           </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigManager({ location, orgId, locId }: { location?: Location, orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Location>>(location || { name: '', address: '', phoneNumber: '', taxRate: 0, logo: '', ticketHeader: '', ticketFooter: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (location) setForm(location); }, [location]);

  const save = async () => {
    setLoading(true);
    try {
      const data = { ...form, updatedAt: Date.now() };
      delete (data as any).id;
      await updateDoc(doc(db, 'orgs', orgId, 'locations', locId), data);
      toast({ title: "Configuración guardada correctamente" });
    } catch (e) { toast({ variant: 'destructive', title: "Error al guardar" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
       <Card className="rounded-[2rem] border-2 shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30"><CardTitle className="font-black uppercase italic text-xl">Información de la Sede</CardTitle></CardHeader>
          <CardContent className="pt-8 space-y-4">
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-1">Nombre Comercial</Label>
                <Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl" />
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-1">Dirección Física</Label>
                <Input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="h-12 rounded-xl" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <Label className="text-[10px] font-black uppercase ml-1">Teléfono</Label>
                   <Input value={form.phoneNumber || ''} onChange={e => setForm({...form, phoneNumber: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1">
                   <Label className="text-[10px] font-black uppercase ml-1">Impuesto (IVA/TAX %)</Label>
                   <Input type="number" value={form.taxRate || 0} onChange={e => setForm({...form, taxRate: Number(e.target.value)})} className="h-12 rounded-xl" />
                </div>
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-1">URL Logo Sucursal</Label>
                <Input value={form.logo || ''} onChange={e => setForm({...form, logo: e.target.value})} className="h-12 rounded-xl" />
             </div>
          </CardContent>
       </Card>

       <Card className="rounded-[2rem] border-2 shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30"><CardTitle className="font-black uppercase italic text-xl flex items-center gap-2"><Receipt className="h-5 w-5" /> Configuración de Ticket</CardTitle></CardHeader>
          <CardContent className="pt-8 space-y-4">
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-1">Mensaje Superior (Header)</Label>
                <Textarea placeholder="Ej: ¡Bienvenido a RestauranteFlow!" value={form.ticketHeader || ''} onChange={e => setForm({...form, ticketHeader: e.target.value})} className="min-h-[100px] rounded-xl" />
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase ml-1">Mensaje Inferior (Footer)</Label>
                <Textarea placeholder="Ej: Gracias por su visita. ¡Vuelva pronto!" value={form.ticketFooter || ''} onChange={e => setForm({...form, ticketFooter: e.target.value})} className="min-h-[100px] rounded-xl" />
             </div>
             <Button className="w-full h-16 font-black text-xl shadow-2xl shadow-primary/20 rounded-2xl mt-4" onClick={save} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'GUARDAR TODA LA CONFIGURACIÓN'}
             </Button>
          </CardContent>
       </Card>
    </div>
  );
}
