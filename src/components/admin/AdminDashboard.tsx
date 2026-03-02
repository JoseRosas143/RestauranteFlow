
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
  Star, ShoppingBag, Calendar, Settings, ShieldAlert, Store, RefreshCw, LogOut 
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
      <header className="bg-white border-b px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="flex items-center gap-3">
             {currentLocationData?.logo && <img src={currentLocationData.logo} className="h-10 w-10 rounded-md object-cover border" alt="Logo" />}
             <div>
                <h1 className="text-2xl font-black text-primary italic uppercase tracking-tighter leading-none">RestauranteFlow</h1>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{currentLocationData?.name || 'Sucursal'} • ADMIN</p>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setLoc(null)} className="gap-2 font-bold border-2">
            <Store className="h-4 w-4" /> CAMBIAR SUCURSAL
          </Button>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2 font-bold">
            <LogOut className="h-4 w-4" /> CERRAR SESIÓN
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8">
        <Tabs defaultValue="articulos" className="space-y-6">
          <div className="max-w-7xl mx-auto">
            <TabsList className="bg-white border shadow-sm w-full h-14 p-1 gap-1">
              <TabsTrigger value="articulos" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Package className="h-4 w-4" /> Artículos</TabsTrigger>
              <TabsTrigger value="categorias" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Layers className="h-4 w-4" /> Categorías</TabsTrigger>
              <TabsTrigger value="modificadores" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Tag className="h-4 w-4" /> Modificadores</TabsTrigger>
              <TabsTrigger value="descuentos" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Percent className="h-4 w-4" /> Descuentos</TabsTrigger>
              <TabsTrigger value="clientes" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Users className="h-4 w-4" /> Clientes</TabsTrigger>
              <TabsTrigger value="config" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Settings className="h-4 w-4" /> Configuración</TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="articulos">
                <ArticulosManager items={items || []} categories={categories || []} orgId={orgId!} locId={locId!} />
              </TabsContent>

              <TabsContent value="categorias">
                <CategoriasManager categories={categories || []} orgId={orgId!} locId={locId!} />
              </TabsContent>

              <TabsContent value="modificadores">
                <ModificadoresManager modifiers={modifiers || []} orgId={orgId!} locId={locId!} />
              </TabsContent>

              <TabsContent value="descuentos">
                <DescuentosManager discounts={discounts || []} orgId={orgId!} locId={locId!} />
              </TabsContent>

              <TabsContent value="clientes">
                <ClientesManager customers={customers || []} orgId={orgId!} />
              </TabsContent>

              <TabsContent value="config">
                <ConfigManager 
                  location={currentLocationData || undefined} 
                  staff={staffUsers || []} 
                  orgId={orgId!} 
                  locId={locId!} 
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

function ArticulosManager({ items, categories, orgId, locId }: { items: MenuItem[], categories: Category[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialItemState: Partial<MenuItem> = {
    name: '',
    price: 0,
    cost: 0,
    category: '',
    soldBy: 'unidad',
    trackInventory: false,
    inventoryCount: 0,
    tpvColor: '#B8732E',
    tpvShape: 'cuadrado',
    reference: '',
    barcode: '',
    image: ''
  };

  const [newItem, setNewItem] = useState<Partial<MenuItem>>(initialItemState);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 512) {
        toast({ variant: 'destructive', title: "Imagen demasiado grande (Max 512KB)" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem({ ...newItem, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveItem = async () => {
    if (!newItem.name || newItem.price === undefined) {
      toast({ variant: 'destructive', title: "Faltan datos obligatorios" });
      return;
    }
    setLoading(true);
    try {
      const cleanData = {
        name: newItem.name || '',
        price: Number(newItem.price || 0),
        cost: Number(newItem.cost || 0),
        category: newItem.category || '',
        soldBy: newItem.soldBy || 'unidad',
        trackInventory: !!newItem.trackInventory,
        inventoryCount: newItem.trackInventory ? Number(newItem.inventoryCount || 0) : 0,
        tpvColor: newItem.tpvColor || '#B8732E',
        tpvShape: newItem.tpvShape || 'cuadrado',
        reference: newItem.reference || '',
        barcode: newItem.barcode || '',
        image: newItem.image || '',
        updatedAt: Date.now()
      };

      const path = collection(db, 'orgs', orgId, 'locations', locId, 'menuItems');
      if (editingId) {
        await updateDoc(doc(path, editingId), cleanData);
        toast({ title: "Artículo Actualizado" });
      } else {
        await addDoc(path, { ...cleanData, createdAt: Date.now() });
        toast({ title: "Artículo Guardado" });
      }
      resetForm();
    } catch (e) {
      toast({ variant: 'destructive', title: "Error al guardar" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewItem(initialItemState);
    setEditingId(null);
  };

  const startEdit = (item: MenuItem) => {
    setNewItem({ ...item });
    setEditingId(item.id!);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-md border-t-4 border-primary">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-xl font-black">{editingId ? 'Editar Artículo' : 'Nuevo Artículo'}</CardTitle>
          {editingId && <Button variant="ghost" size="icon" onClick={resetForm}><X /></Button>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Plato/Producto</Label>
            <Input value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Ej: Choripán Especial" />
          </div>
          
          <div className="space-y-2">
            <Label>Imagen</Label>
            <div className="border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center bg-muted overflow-hidden relative group">
              {newItem.image ? (
                <>
                  <img src={newItem.image} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="sm" onClick={() => setNewItem({...newItem, image: ''})}><Trash2 className="h-4 w-4 mr-2" /> Quitar</Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="opacity-20 h-12 w-12 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">JPG/PNG (Max 512KB)</p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full border-2 border-primary/20 hover:border-primary" onClick={() => document.getElementById('file-up')?.click()}><Upload className="mr-2 h-4 w-4" /> Seleccionar Imagen</Button>
            <input id="file-up" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select onValueChange={v => setNewItem({...newItem, category: v})} value={newItem.category || ''}>
                <SelectTrigger><SelectValue placeholder="Cat" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modo Venta</Label>
              <Select onValueChange={(v: SoldBy) => setNewItem({...newItem, soldBy: v})} value={newItem.soldBy || 'unidad'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="unidad">Por Unidad</SelectItem><SelectItem value="peso">Por Peso (Kg)</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Precio Venta ($)</Label>
              <Input type="number" value={newItem.price ?? ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Coste ($)</Label>
              <Input type="number" value={newItem.cost ?? ''} onChange={e => setNewItem({...newItem, cost: Number(e.target.value)})} />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-xl bg-primary/5">
            <div className="space-y-0.5">
              <Label>Control Stock</Label>
              <p className="text-[10px] text-muted-foreground">Avisar si se agota</p>
            </div>
            <Switch checked={!!newItem.trackInventory} onCheckedChange={v => setNewItem({...newItem, trackInventory: v})} />
          </div>
          {newItem.trackInventory && <Input type="number" placeholder="Stock disponible" value={newItem.inventoryCount ?? ''} onChange={e => setNewItem({...newItem, inventoryCount: Number(e.target.value)})} />}
          
          <Button className="w-full h-14 font-black text-lg shadow-lg" onClick={saveItem} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {editingId ? 'ACTUALIZAR ARTÍCULO' : 'GUARDAR ARTÍCULO'}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 shadow-xl">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-xl font-black uppercase">Inventario de Sucursal</CardTitle>
          <CardDescription>Gestione los productos disponibles para esta ubicación.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 border-2 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all group relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-white border-2 overflow-hidden flex items-center justify-center shadow-sm">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.name} /> : <Package className="h-6 w-6 opacity-20 text-primary" />}
                  </div>
                  <div>
                    <div className="font-black text-lg leading-tight">{item.name}</div>
                    <div className="text-[11px] font-bold text-primary uppercase tracking-widest">{item.category}</div>
                    <div className="text-sm font-black text-muted-foreground mt-1">${item.price.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex gap-2 relative z-10">
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2" onClick={() => startEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2 text-destructive hover:bg-destructive hover:text-white" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'locations', locId, 'menuItems', item.id!))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                {item.trackInventory && (
                   <div className={`absolute bottom-0 right-0 px-3 py-0.5 text-[10px] font-black uppercase rounded-tl-xl ${Number(item.inventoryCount) < 5 ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground'}`}>
                      Stock: {item.inventoryCount}
                   </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClientesManager({ customers, orgId }: { customers: Customer[], orgId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const loyaltyDocRef = useMemoFirebase(() => 
    orgId ? doc(db, 'orgs', orgId, 'settings', 'loyalty') : null, 
    [db, orgId]
  );
  
  const { data: loyaltySettings } = useDoc<LoyaltySettings>(loyaltyDocRef);
  const [newPercentage, setNewPercentage] = useState<string>('');

  useEffect(() => {
    if (loyaltySettings) setNewPercentage(String(loyaltySettings.pointsPercentage || ''));
  }, [loyaltySettings]);

  const saveLoyaltySettings = async () => {
    if (!loyaltyDocRef) return;
    try {
      await setDoc(loyaltyDocRef, { pointsPercentage: Number(newPercentage || 0) });
      toast({ title: "Configuración Guardada" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error al guardar" });
    }
  };

  const initialCustomer: Partial<Customer> = {
    name: '',
    phone: '',
    email: '',
    birthday: '',
    city: '',
    acceptsMarketing: false,
    acceptsTerms: false,
    points: 0,
    totalVisits: 0,
    lastVisit: 0
  };

  const [customerForm, setCustomerForm] = useState<Partial<Customer>>(initialCustomer);

  const handleSaveCustomer = async () => {
    if (!customerForm.name || !customerForm.phone || !customerForm.acceptsTerms) {
      toast({ variant: 'destructive', title: "Nombre, WhatsApp y Términos son obligatorios" });
      return;
    }
    setLoading(true);
    try {
      const path = collection(db, 'orgs', orgId, 'customers');
      const cleanData = {
        name: customerForm.name || '',
        phone: customerForm.phone || '',
        email: customerForm.email || '',
        birthday: customerForm.birthday || '',
        city: customerForm.city || '',
        acceptsMarketing: !!customerForm.acceptsMarketing,
        acceptsTerms: !!customerForm.acceptsTerms,
        points: Number(customerForm.points || 0),
        totalVisits: Number(customerForm.totalVisits || 0),
        lastVisit: Number(customerForm.lastVisit || 0),
        updatedAt: Date.now()
      };

      if (selectedCustomer && isEditing) {
        await updateDoc(doc(path, selectedCustomer.id!), cleanData);
        toast({ title: "Cliente Actualizado" });
      } else {
        await addDoc(path, { ...cleanData, createdAt: Date.now() });
        toast({ title: "Cliente Registrado" });
      }
      setIsEditing(false);
      setCustomerForm(initialCustomer);
      setSelectedCustomer(null);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error al guardar" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 border-t-4 border-primary shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center bg-muted/20">
          <div>
            <CardTitle className="text-xl font-black uppercase italic">Clientes</CardTitle>
            <CardDescription className="text-[10px] font-bold">PROGRAMA DE FIDELIZACIÓN</CardDescription>
          </div>
          <Button size="icon" variant="outline" className="rounded-full border-2" onClick={() => { setSelectedCustomer(null); setIsEditing(false); setCustomerForm(initialCustomer); }}>
            <Plus className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/10 space-y-3">
              <div className="flex items-center gap-2 font-black text-xs uppercase text-primary tracking-widest">
                <Settings className="h-4 w-4" /> REGLA DE PUNTOS
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input 
                    type="number" 
                    value={newPercentage || ''} 
                    onChange={e => setNewPercentage(e.target.value)} 
                    placeholder="%"
                    className="pr-8 h-12 font-black text-lg text-center"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-black">%</span>
                </div>
                <Button className="h-12 px-6 font-black" onClick={saveLoyaltySettings}>SET</Button>
              </div>
              <p className="text-[10px] text-muted-foreground italic leading-tight">Porcentaje de la venta que el cliente acumula en puntos canjeables.</p>
            </div>
          </div>
          <ScrollArea className="h-[450px]">
            <div className="space-y-3 pr-2">
              {customers.map(c => (
                <div 
                  key={c.id} 
                  className={`p-4 border-2 rounded-2xl cursor-pointer transition-all hover:bg-primary/5 ${selectedCustomer?.id === c.id ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/20'}`}
                  onClick={() => { setSelectedCustomer(c); setCustomerForm(c); setIsEditing(false); }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-black text-lg leading-none">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </div>
                    </div>
                    <Badge className="bg-primary text-white font-black">{Number(c.points || 0).toFixed(0)} PTS</Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 overflow-hidden bg-zinc-950 text-white shadow-2xl rounded-3xl border-0">
        {selectedCustomer && !isEditing ? (
          <div className="h-full flex flex-col">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setSelectedCustomer(null)}>
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-xl font-black uppercase tracking-tighter">Perfil del Miembro</h2>
              </div>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/50 font-black px-4 py-1">ACTIVO</Badge>
            </div>

            <div className="flex-1 p-10 space-y-12">
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 rounded-3xl bg-zinc-800 border-4 border-primary flex items-center justify-center shadow-2xl relative overflow-hidden group">
                  <Users className="h-16 w-16 text-primary group-hover:scale-110 transition-transform" />
                  <div className="absolute bottom-0 inset-x-0 bg-primary h-2" />
                </div>
                <div className="text-center">
                  <h3 className="text-4xl font-black tracking-tighter">{selectedCustomer.name}</h3>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-1">Socio desde {new Date(selectedCustomer.createdAt || Date.now()).getFullYear()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                <div className="p-6 bg-zinc-900 rounded-3xl border border-white/5 space-y-2">
                  <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Contacto Directo</p>
                  <div className="flex items-center gap-4"><Mail className="h-5 w-5 text-primary opacity-70" /><span className="font-bold">{selectedCustomer.email || 'No registrado'}</span></div>
                  <div className="flex items-center gap-4"><Phone className="h-5 w-5 text-primary opacity-70" /><span className="font-bold">{selectedCustomer.phone}</span></div>
                </div>

                <div className="p-6 bg-zinc-900 rounded-3xl border border-white/5 space-y-2 text-center">
                  <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Saldo de Fidelidad</p>
                  <div className="text-6xl font-black text-primary leading-tight">{Number(selectedCustomer.points || 0).toFixed(0)}</div>
                  <p className="font-black text-sm text-zinc-400">PUNTOS ACUMULADOS</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/5 max-w-2xl mx-auto">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-zinc-900 rounded-2xl"><Star className="h-6 w-6 text-yellow-500" /></div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase">Nivel Socio</div>
                  <div className="font-black">PLATA</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-zinc-900 rounded-2xl"><ShoppingBag className="h-6 w-6 text-emerald-500" /></div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase">Frecuencia</div>
                  <div className="font-black">{selectedCustomer.totalVisits || 0} Visitas</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-zinc-900 rounded-2xl"><Calendar className="h-6 w-6 text-blue-500" /></div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase">Último Consumo</div>
                  <div className="font-black">{selectedCustomer.lastVisit ? new Date(selectedCustomer.lastVisit).toLocaleDateString() : 'Pendiente'}</div>
                </div>
              </div>

              <div className="pt-10 flex gap-4 max-w-2xl mx-auto">
                <Button variant="outline" className="flex-1 h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white font-black rounded-2xl" onClick={() => setIsEditing(true)}>EDITAR PERFIL</Button>
                <Button className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl">CANJEAR PUNTOS</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 space-y-10">
            <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">{isEditing ? 'Actualizar Información' : 'Registro de Cliente'}</h2>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Ingrese los datos para el programa de recompensas</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><Label className="text-zinc-500 font-black text-xs uppercase">Nombre Completo *</Label><Input className="h-14 bg-zinc-900 border-zinc-800 text-white font-bold px-5" value={customerForm.name || ''} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} /></div>
              <div className="space-y-2"><Label className="text-zinc-500 font-black text-xs uppercase">WhatsApp / Celular *</Label><Input className="h-14 bg-zinc-900 border-zinc-800 text-white font-bold px-5" value={customerForm.phone || ''} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} /></div>
              <div className="space-y-2"><Label className="text-zinc-500 font-black text-xs uppercase">Email</Label><Input className="h-14 bg-zinc-900 border-zinc-800 text-white font-bold px-5" value={customerForm.email || ''} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} /></div>
              <div className="space-y-2"><Label className="text-zinc-500 font-black text-xs uppercase">Fecha de Nacimiento</Label><Input type="date" className="h-14 bg-zinc-900 border-zinc-800 text-white font-bold px-5" value={customerForm.birthday || ''} onChange={e => setCustomerForm({...customerForm, birthday: e.target.value})} /></div>
            </div>

            <div className="space-y-5 p-8 bg-zinc-900/50 rounded-3xl border border-white/5">
               <div className="flex items-center justify-between"><Label className="font-bold text-zinc-300">Deseo recibir promociones y novedades</Label><Switch checked={!!customerForm.acceptsMarketing} onCheckedChange={v => setCustomerForm({...customerForm, acceptsMarketing: v})} /></div>
               <div className="flex items-center justify-between"><Label className="font-black text-primary">He leído y acepto los términos de uso *</Label><Switch checked={!!customerForm.acceptsTerms} onCheckedChange={v => setCustomerForm({...customerForm, acceptsTerms: v})} /></div>
            </div>

            <Button className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl shadow-2xl rounded-2xl" onClick={handleSaveCustomer} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />}{isEditing ? 'ACTUALIZAR PERFIL' : 'REGISTRAR CLIENTE'}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function CategoriasManager({ categories, orgId, locId }: { categories: Category[], orgId: string, locId: string }) {
  const db = useFirestore();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#B8732E');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="border-t-4 border-primary"><CardHeader><CardTitle className="font-black uppercase">Nueva Categoría</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label>Nombre</Label><Input value={name || ''} onChange={e => setName(e.target.value)} placeholder="Ej: Hamburguesas" /></div>
        <div className="space-y-2"><Label>Color en TPV</Label><Input type="color" value={color || '#B8732E'} onChange={e => setColor(e.target.value)} className="h-14 cursor-pointer" /></div>
        <Button className="w-full h-12 font-black" onClick={() => {
          if (!name) return;
          addDoc(collection(db, 'orgs', orgId, 'locations', locId, 'categories'), { name, color, createdAt: Date.now() });
          setName('');
        }}><Plus className="mr-2 h-5 w-5" /> CREAR CATEGORÍA</Button>
      </CardContent></Card>
      <div className="grid grid-cols-2 gap-4">{categories.map(c => (
        <Card key={c.id} className="border-l-8 transition-transform hover:scale-105" style={{ borderLeftColor: c.color }}>
          <CardContent className="p-5 flex justify-between items-center"><span className="font-black uppercase tracking-tight">{c.name}</span>
          <Button variant="ghost" size="icon" className="text-destructive rounded-full" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'locations', locId, 'categories', c.id!))}><Trash2 className="h-4 w-4" /></Button>
        </CardContent></Card>
      ))}</div>
    </div>
  );
}

function ModificadoresManager({ modifiers, orgId, locId }: { modifiers: Modifier[], orgId: string, locId: string }) {
  const db = useFirestore();
  const [name, setName] = useState('');
  const [options, setOptions] = useState<{name: string, price: number}[]>([{name: '', price: 0}]);
  const save = async () => {
    if (!name || options[0].name === '') return;
    await addDoc(collection(db, 'orgs', orgId, 'locations', locId, 'modifiers'), { name, options: options.filter(o => o.name !== ''), createdAt: Date.now() });
    setName(''); setOptions([{name: '', price: 0}]);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="border-t-4 border-primary"><CardHeader><CardTitle className="font-black uppercase">Nuevo Grupo de Extras</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Input value={name || ''} onChange={e => setName(e.target.value)} placeholder="Nombre (ej: Toppings)" className="h-12" />
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-muted-foreground">Opciones y Precios Adicionales</Label>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Extra" value={opt.name || ''} onChange={e => {const n = [...options]; n[i].name = e.target.value; setOptions(n);}} />
              <Input type="number" placeholder="$" className="w-24" value={opt.price ?? ''} onChange={e => {const n = [...options]; n[i].price = Number(e.target.value); setOptions(n);}} />
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full border-2 border-primary/20 hover:border-primary font-bold" onClick={() => setOptions([...options, {name: '', price: 0}])}><Plus className="h-4 w-4" /> AÑADIR OPCIÓN</Button>
        <Button className="w-full h-12 font-black shadow-lg" onClick={save}>GUARDAR MODIFICADOR</Button>
      </CardContent></Card>
      <div className="space-y-4">{modifiers.map(m => (
        <Card key={m.id} className="border-2"><CardHeader className="py-3 bg-muted/20 border-b"><CardTitle className="text-sm font-black uppercase tracking-widest">{m.name}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2 py-4">{m.options.map((o, i) => (
          <Badge key={i} variant="secondary" className="px-3 py-1 font-bold">+{o.name} (${o.price})</Badge>
        ))}</CardContent></Card>
      ))}</div>
    </div>
  );
}

function DescuentosManager({ discounts, orgId, locId }: { discounts: Discount[], orgId: string, locId: string }) {
  const db = useFirestore();
  const [name, setName] = useState('');
  const [value, setValue] = useState(0);
  const [type, setType] = useState<DiscountType>('porcentaje');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="border-t-4 border-primary"><CardHeader><CardTitle className="font-black uppercase">Nueva Regla de Descuento</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label>Nombre Promoción</Label><Input value={name || ''} onChange={e => setName(e.target.value)} placeholder="Ej: Promo Lunes" /></div>
        <div className="space-y-2">
          <Label>Valor y Tipo</Label>
          <div className="flex gap-2">
            <Input type="number" value={value ?? ''} onChange={e => setValue(Number(e.target.value))} className="flex-1" />
            <Select value={type || 'porcentaje'} onValueChange={(v: DiscountType) => setType(v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="porcentaje">En %</SelectItem><SelectItem value="monto">Fijo $</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <Button className="w-full h-12 font-black" onClick={() => {
          if (!name) return;
          addDoc(collection(db, 'orgs', orgId, 'locations', locId, 'discounts'), { name, value, type, createdAt: Date.now() });
          setName(''); setValue(0);
        }}>GUARDAR REGLA</Button>
      </CardContent></Card>
      <div className="grid grid-cols-2 gap-4">{discounts.map(d => (
        <Card key={d.id} className="bg-primary/5 border-2 border-primary/20"><CardContent className="p-5 flex justify-between items-center">
          <div><div className="font-black uppercase text-primary leading-none">{d.name}</div><div className="text-lg font-black mt-1">{d.type === 'porcentaje' ? `${d.value}%` : `$${d.value}`}</div></div>
          <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'locations', locId, 'discounts', d.id!))}><Trash2 className="h-4 w-4" /></Button>
        </CardContent></Card>
      ))}</div>
    </div>
  );
}

function ConfigManager({ location, staff, orgId, locId }: { location?: Location, staff: UserProfile[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [locForm, setLocForm] = useState<Partial<Location>>(location || { name: '', address: '', phoneNumber: '', taxRate: 0, logo: '' });
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState<Partial<UserProfile>>({ name: '', email: '', role: 'cashier', allowedLocIds: [locId] });

  useEffect(() => {
    if (location) {
      setLocForm({
        name: location.name || '',
        address: location.address || '',
        phoneNumber: location.phoneNumber || '',
        taxRate: location.taxRate || 0,
        logo: location.logo || ''
      });
    }
  }, [location]);

  const saveLocationDetails = async () => {
    setLoading(true);
    try {
      const dataToSave = {
        name: locForm.name || '',
        address: locForm.address || '',
        phoneNumber: locForm.phoneNumber || '',
        taxRate: Number(locForm.taxRate || 0),
        logo: locForm.logo || '',
        updatedAt: Date.now()
      };
      
      await updateDoc(doc(db, 'orgs', orgId, 'locations', locId), dataToSave);
      toast({ title: "Sucursal Actualizada" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Error al guardar", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const createNewLocation = async () => {
    setLoading(true);
    try {
      const newLocRef = await addDoc(collection(db, 'orgs', orgId, 'locations'), {
        name: 'Nueva Sucursal',
        address: 'Dirección por definir',
        phoneNumber: '',
        taxRate: 0,
        createdAt: Date.now(),
        logo: ''
      });
      toast({ title: "¡Nueva sucursal creada!", description: "Ahora puede configurarla seleccionándola arriba." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Error al crear sucursal" });
    } finally {
      setLoading(false);
    }
  };

  const resetAnalytics = async () => {
    if (!confirm("¿Seguro que deseas resetear todas las analíticas de esta sucursal? Esta acción es irreversible.")) return;
    setLoading(true);
    try {
      const path = collection(db, 'orgs', orgId, 'locations', locId, 'analytics', 'daily', 'days');
      const snap = await getDocs(path);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      toast({ title: "Analíticas Reseteadas" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error al resetear" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLocForm({ ...locForm, logo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const addUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({ variant: 'destructive', title: "Nombre y Email son requeridos" });
      return;
    }
    try {
      await addDoc(collection(db, 'orgs', orgId, 'users'), { 
        ...newUser, 
        uid: `USER-${Date.now()}`,
        orgId, 
        allowedLocIds: [locId],
        createdAt: Date.now()
      });
      toast({ title: "Usuario Creado", description: "El empleado ahora puede acceder con su ID." });
      setNewUser({ name: '', email: '', role: 'cashier', allowedLocIds: [locId] });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error al añadir usuario" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border-t-4 border-primary shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center bg-muted/20">
          <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tighter"><Store className="h-6 w-6" /> Perfil de Sucursal</CardTitle>
          <Button variant="outline" size="sm" onClick={createNewLocation} className="border-2 font-bold gap-2"><Plus className="h-4 w-4" /> AGREGAR OTRA SUCURSAL</Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed flex items-center justify-center overflow-hidden relative shadow-inner">
              {locForm.logo ? (
                <img src={locForm.logo} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <ImageIcon className="opacity-10 h-10 w-10" />
              )}
            </div>
            <Button variant="outline" size="sm" className="font-bold border-2" onClick={() => document.getElementById('logo-up')?.click()}><Upload className="mr-2 h-4 w-4" /> ACTUALIZAR LOGO</Button>
            <input id="logo-up" type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Nombre Comercial</Label><Input value={locForm.name || ''} onChange={e => setLocForm({...locForm, name: e.target.value})} /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">WhatsApp / Delivery</Label><Input value={locForm.phoneNumber || ''} onChange={e => setLocForm({...locForm, phoneNumber: e.target.value})} /></div>
          </div>
          <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Ubicación Física</Label><Input value={locForm.address || ''} onChange={e => setLocForm({...locForm, address: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase">Tasa de Impuesto (%)</Label>
               <div className="relative">
                 <Input type="number" value={locForm.taxRate ?? ''} onChange={e => setLocForm({...locForm, taxRate: Number(e.target.value)})} className="pr-8 font-black" />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-black">%</span>
               </div>
             </div>
          </div>
          <Button className="w-full h-14 font-black text-lg shadow-xl" onClick={saveLocationDetails} disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />}
            GUARDAR CAMBIOS DE SEDE
          </Button>
        </CardContent>
      </Card>

      <Card className="border-t-4 border-primary shadow-xl">
        <CardHeader className="bg-muted/20"><CardTitle className="flex items-center gap-2 font-black uppercase tracking-tighter"><ShieldAlert className="h-6 w-6" /> Equipo y Permisos</CardTitle></CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="p-6 border-2 rounded-3xl bg-primary/5 space-y-4">
            <h4 className="font-black text-xs uppercase tracking-widest text-primary">Contratar nuevo staff</h4>
            <div className="space-y-3">
              <Input placeholder="Nombre Completo" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} className="h-11 font-bold" />
              <Input type="email" placeholder="Correo Corporativo" value={newUser.email || ''} onChange={e => setNewUser({...newUser, email: e.target.value})} className="h-11 font-bold" />
              <div className="grid grid-cols-1 gap-2">
                <Label className="text-[10px] font-black uppercase">Rol y Nivel de Acceso</Label>
                <Select value={newUser.role || 'cashier'} onValueChange={(v: UserRole) => setNewUser({...newUser, role: v})}>
                  <SelectTrigger className="h-11 font-black"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin" className="font-bold">👑 Administrador (Full)</SelectItem>
                    <SelectItem value="manager" className="font-bold">👔 Gerente (Config)</SelectItem>
                    <SelectItem value="cashier" className="font-bold">💰 Cajero (POS)</SelectItem>
                    <SelectItem value="kitchen" className="font-bold">👨‍🍳 Cocina (KDS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="outline" className="w-full h-12 font-black border-2 border-primary text-primary hover:bg-primary hover:text-white" onClick={addUser}>DAR DE ALTA EMPLEADO</Button>
          </div>
          <div className="space-y-3">
            <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground px-2">Plantilla Actual</h4>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2 pr-2">
                {staff.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-4 border-2 rounded-2xl bg-white hover:border-primary/40 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm border-2 border-primary/20">
                        {String(u.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-sm leading-none">{u.name || 'Sin nombre'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-[9px] font-black uppercase py-0 px-2 bg-primary/10 text-primary border-none">{u.role}</Badge>
                          <span className="text-[10px] text-muted-foreground font-bold">{u.email}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive rounded-full hover:bg-destructive/10" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'users', u.id!))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-destructive/20 bg-destructive/5 lg:col-span-2 rounded-3xl overflow-hidden">
        <CardHeader className="bg-destructive/10"><CardTitle className="text-destructive flex items-center gap-2 font-black uppercase italic tracking-tighter"><ShieldAlert className="h-6 w-6" /> Zona de Seguridad Crítica</CardTitle></CardHeader>
        <CardContent className="p-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
             <h4 className="font-black text-lg text-destructive">Mantenimiento de Datos</h4>
             <p className="text-sm text-muted-foreground font-medium">Resetear las analíticas limpiará todos los registros de ventas y estadísticas de esta sucursal. Esta acción no se puede deshacer.</p>
             <Button variant="destructive" className="w-full h-12 font-black mt-4 shadow-lg" onClick={resetAnalytics} disabled={loading}><RefreshCw className="mr-2 h-5 w-5" /> REINICIAR CONTADORES DE VENTA</Button>
          </div>
          <div className="flex-1 space-y-2 border-t md:border-t-0 md:border-l border-destructive/20 pt-6 md:pt-0 md:pl-8">
             <h4 className="font-black text-lg text-destructive">Cierre de Locación</h4>
             <p className="text-sm text-muted-foreground font-medium">Eliminar esta sucursal borrará permanentemente todos sus productos, menús y configuraciones asociadas.</p>
             <Button variant="outline" className="w-full h-12 font-black border-2 border-destructive/20 text-destructive hover:bg-destructive hover:text-white mt-4">ELIMINAR ESTA SUCURSAL PERMANENTEMENTE</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
