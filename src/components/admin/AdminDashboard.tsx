
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
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore, useCollection, useDoc, useTenant, useMemoFirebase, useAuth } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Plus, Trash2, Package, Loader2, Edit2, 
  X, ArrowLeft, Users, Settings, Store, LogOut, KeyRound, 
  Tag, ImageIcon, Receipt, ChevronRight, Save, 
  Layers, Sliders, Percent, Barcode, Box, Eye, LayoutGrid,
  MapPin, Phone, Globe, CreditCard, QrCode, Building2, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItem, UserProfile, Location, Category, ModifierGroup, Discount } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { orgId, locId } = useTenant();
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
    orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'modifiers'), orderBy('name', 'asc')) : null, 
    [db, orgId, locId]
  );

  const discountsQuery = useMemoFirebase(() => 
    orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'discounts'), orderBy('name', 'asc')) : null, 
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

  const locationsQuery = useMemoFirebase(() => 
    orgId ? query(collection(db, 'orgs', orgId, 'locations'), orderBy('createdAt', 'desc')) : null, 
    [db, orgId]
  );

  const { data: items } = useCollection<MenuItem>(itemsQuery);
  const { data: categories } = useCollection<Category>(categoriesQuery);
  const { data: modifiers } = useCollection<ModifierGroup>(modifiersQuery);
  const { data: discounts } = useCollection<Discount>(discountsQuery);
  const { data: staffUsers } = useCollection<UserProfile>(usersQuery);
  const { data: currentLocationData } = useDoc<Location>(locationDocRef);
  const { data: allLocations } = useCollection<Location>(locationsQuery);

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
             <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border-2 border-primary/20">
               <Store className="h-5 w-5 text-primary" />
             </div>
             <div>
                <h1 className="text-2xl font-black text-primary italic uppercase tracking-tighter leading-none">RestauranteFlow</h1>
                <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase">{currentLocationData?.name || 'ADMINISTRACIÓN'}</p>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-9 px-4 border-2 font-black text-primary gap-2 bg-white">
            <Tag className="h-4 w-4" /> STORE ID: {orgId || '000000'}
          </Badge>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="font-black gap-2 rounded-xl px-6">
            <LogOut className="h-4 w-4" /> SALIR
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8">
        <Tabs defaultValue="menu" className="space-y-6 max-w-7xl mx-auto">
          <TabsList className="bg-white border-2 shadow-sm w-full h-16 p-2 gap-2 rounded-[1.25rem]">
            <TabsTrigger value="menu" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl"><Package className="h-4 w-4" /> Artículos</TabsTrigger>
            <TabsTrigger value="personal" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl"><Users className="h-4 w-4" /> Equipo</TabsTrigger>
            <TabsTrigger value="config" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl"><Settings className="h-4 w-4" /> Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b-2 border-primary/10 pb-2">
                <Package className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Gestión de Menú</h2>
              </div>
              <ArticulosManager items={items || []} categories={categories || []} modifiers={modifiers || []} orgId={orgId!} locId={locId!} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b-2 border-primary/10 pb-2">
                  <Layers className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">Categorías</h2>
                </div>
                <CategoriasManager categories={categories || []} items={items || []} orgId={orgId!} locId={locId!} />
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b-2 border-primary/10 pb-2">
                  <Sliders className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">Modificadores</h2>
                </div>
                <ModifiersManager modifiers={modifiers || []} orgId={orgId!} locId={locId!} />
              </section>
            </div>

            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b-2 border-primary/10 pb-2">
                <Percent className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Descuentos</h2>
              </div>
              <DiscountsManager discounts={discounts || []} orgId={orgId!} locId={locId!} />
            </section>
          </TabsContent>

          <TabsContent value="personal">
            <StaffManager staff={staffUsers || []} orgId={orgId!} locId={locId!} />
          </TabsContent>

          <TabsContent value="config">
            <ConfigManager location={currentLocationData || undefined} orgId={orgId!} locId={locId!} allLocations={allLocations || []} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ArticulosManager({ items, categories, modifiers, orgId, locId }: { items: MenuItem[], categories: Category[], modifiers: ModifierGroup[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialState: Partial<MenuItem> = { 
    name: '', price: 0, cost: 0, category: '', reference: '', barcode: '',
    soldBy: 'unidad', trackInventory: false, inventoryCount: 0, 
    tpvColor: '#B8732E', tpvShape: 'cuadrado', modifierIds: [], image: ''
  };
  const [form, setForm] = useState<Partial<MenuItem>>(initialState);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const save = () => {
    if (!form.name || !form.category) {
      toast({ variant: 'destructive', title: 'Faltan datos', description: 'Nombre y categoría obligatorios.' });
      return;
    }
    setLoading(true);
    const cleanData = {
      name: form.name || '',
      price: Number(form.price) || 0,
      cost: Number(form.cost) || 0,
      category: form.category || '',
      reference: form.reference || '',
      barcode: form.barcode || '',
      soldBy: form.soldBy || 'unidad',
      trackInventory: !!form.trackInventory,
      inventoryCount: Number(form.inventoryCount) || 0,
      tpvColor: form.tpvColor || '#B8732E',
      tpvShape: form.tpvShape || 'cuadrado',
      modifierIds: form.modifierIds || [],
      image: form.image || '',
      updatedAt: Date.now()
    };

    const colRef = collection(db, 'orgs', orgId, 'locations', locId, 'menuItems');
    
    if (editingId) {
      const docRef = doc(colRef, editingId);
      updateDoc(docRef, cleanData)
        .then(() => {
          toast({ title: "Artículo actualizado" });
          setForm(initialState);
          setEditingId(null);
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: cleanData
          }));
        })
        .finally(() => setLoading(false));
    } else {
      addDoc(colRef, { ...cleanData, createdAt: Date.now() })
        .then(() => {
          toast({ title: "Artículo creado" });
          setForm(initialState);
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: colRef.path,
            operation: 'create',
            requestResourceData: cleanData
          }));
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <div className="space-y-8">
      <Card className="rounded-[2rem] border-2 border-t-8 border-t-primary shadow-xl">
        <CardHeader><CardTitle className="font-black uppercase italic tracking-tighter text-2xl">{editingId ? 'EDITAR ARTÍCULO' : 'NUEVO ARTÍCULO'}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Nombre *</Label>
              <Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Precio Venta ($)</Label>
                <Input type="number" value={form.price ?? 0} onChange={e => setForm({...form, price: Number(e.target.value)})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Costo ($)</Label>
                <Input type="number" value={form.cost ?? 0} onChange={e => setForm({...form, cost: Number(e.target.value)})} className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Categoría *</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Vendido por</Label>
              <Select value={form.soldBy} onValueChange={(v: any) => setForm({...form, soldBy: v})}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidad">Unidad</SelectItem>
                  <SelectItem value="peso">Peso (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase"><Barcode className="h-3 w-3 inline mr-1" /> Código Barras</Label>
                <Input value={form.barcode || ''} onChange={e => setForm({...form, barcode: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Referencia</Label>
                <Input value={form.reference || ''} onChange={e => setForm({...form, reference: e.target.value})} className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="p-4 bg-muted/20 rounded-2xl border-2 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase flex items-center gap-2"><Box className="h-3 w-3" /> Controlar Stock</Label>
                <Checkbox checked={!!form.trackInventory} onCheckedChange={v => setForm({...form, trackInventory: !!v})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Piezas Disponibles</Label>
                <Input type="number" disabled={!form.trackInventory} value={form.inventoryCount ?? 0} onChange={e => setForm({...form, inventoryCount: Number(e.target.value)})} className="h-10 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Cargar Imagen</Label>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl border-2 flex items-center justify-center bg-muted overflow-hidden">
                  {form.image ? <img src={form.image} className="w-full h-full object-cover" /> : <ImageIcon className="h-6 w-6 opacity-20" />}
                </div>
                <div className="flex-1">
                  <Input type="file" accept="image/*" onChange={handleFileChange} className="h-10 text-xs rounded-xl cursor-pointer file:font-black file:uppercase file:text-[8px] file:bg-primary file:text-white file:border-0 file:rounded-md file:mr-2" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-l pl-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Color TPV</Label>
                <Input type="color" value={form.tpvColor || '#B8732E'} onChange={e => setForm({...form, tpvColor: e.target.value})} className="h-12 w-full rounded-xl cursor-pointer" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Forma TPV</Label>
                <Select value={form.tpvShape} onValueChange={(v: any) => setForm({...form, tpvShape: v})}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cuadrado">Cuadrado</SelectItem>
                    <SelectItem value="circulo">Círculo</SelectItem>
                    <SelectItem value="hexágono">Hexágono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Modificadores</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                {modifiers.map(m => (
                  <div key={m.id} className="flex items-center gap-2 text-[10px] font-bold bg-muted/40 p-2 rounded-lg">
                    <Checkbox 
                      checked={form.modifierIds?.includes(m.id!)} 
                      onCheckedChange={v => {
                        const ids = form.modifierIds || [];
                        if (v) setForm({...form, modifierIds: [...ids, m.id!]});
                        else setForm({...form, modifierIds: ids.filter(id => id !== m.id)});
                      }}
                    />
                    <span className="truncate">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full h-16 font-black text-xl shadow-2xl rounded-2xl" onClick={save} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : editingId ? 'GUARDAR CAMBIOS' : 'AÑADIR AL MENÚ'}
            </Button>
            {editingId && <Button variant="ghost" className="w-full font-bold uppercase text-[10px]" onClick={() => {setEditingId(null); setForm(initialState);}}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <Card key={item.id} className="rounded-2xl border-2 hover:border-primary transition-all group overflow-hidden bg-white shadow-sm">
            <div className="p-4 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl border-2 flex-shrink-0 flex items-center justify-center overflow-hidden ${item.tpvShape === 'circulo' ? 'rounded-full' : ''}`} style={{ backgroundColor: item.tpvColor }}>
                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="h-6 w-6 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm uppercase italic truncate">{item.name}</h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">{item.category}</p>
                <div className="flex justify-between items-end mt-1">
                   <p className="font-black text-primary text-md leading-none">${item.price.toFixed(2)}</p>
                   <p className="text-[8px] font-bold opacity-40">REF: {item.reference || 'N/A'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10" onClick={() => {setForm(item); setEditingId(item.id!);}}><Edit2 className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-full hover:bg-destructive/10" onClick={() => {
                   const docRef = doc(db, 'orgs', orgId, 'locations', locId, 'menuItems', item.id!);
                   deleteDoc(docRef).catch(async () => {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
                   });
                }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CategoriasManager({ categories, items, orgId, locId }: { categories: Category[], items: MenuItem[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', color: '#B8732E' });

  const save = () => {
    if (!form.name) return;
    const colRef = collection(db, 'orgs', orgId, 'locations', locId, 'categories');
    addDoc(colRef, { ...form, updatedAt: Date.now() })
      .then(() => {
        setForm({ name: '', color: '#B8732E' });
        toast({ title: "Categoría creada" });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: form }));
      });
  };

  return (
    <Card className="rounded-[2rem] border-2 shadow-xl h-fit">
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4 border-b pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Nombre</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Color</Label>
              <Input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="h-10 w-full cursor-pointer rounded-xl" />
            </div>
          </div>
          <Button className="w-full h-12 font-black rounded-xl" onClick={save}>AÑADIR CATEGORÍA</Button>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex justify-between items-center p-3 border-2 rounded-xl bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-black uppercase text-xs italic tracking-tighter">{cat.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                   const docRef = doc(db, 'orgs', orgId, 'locations', locId, 'categories', cat.id!);
                   deleteDoc(docRef).catch(async () => {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
                   });
                }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ModifiersManager({ modifiers, orgId, locId }: { modifiers: ModifierGroup[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [options, setOptions] = useState<{name: string, price: number}[]>([]);
  const [optName, setOptName] = useState('');
  const [optPrice, setOptPrice] = useState(0);

  const addOption = () => {
    if (!optName) return;
    setOptions([...options, { name: optName, price: optPrice }]);
    setOptName(''); setOptPrice(0);
  };

  const save = () => {
    if (!name || options.length === 0) {
      toast({ variant: 'destructive', title: 'Datos incompletos' });
      return;
    }
    setLoading(true);
    const colRef = collection(db, 'orgs', orgId, 'locations', locId, 'modifiers');
    const cleanData = { name, options, updatedAt: Date.now() };

    if (editingId) {
      const docRef = doc(colRef, editingId);
      updateDoc(docRef, cleanData)
        .then(() => {
          toast({ title: "Modificador actualizado" });
          setName(''); setOptions([]); setEditingId(null);
        })
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: cleanData }));
        })
        .finally(() => setLoading(false));
    } else {
      addDoc(colRef, { ...cleanData, createdAt: Date.now() })
        .then(() => {
          toast({ title: "Modificador creado" });
          setName(''); setOptions([]);
        })
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: cleanData }));
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <Card className="rounded-[2rem] border-2 shadow-xl">
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4 border-b pb-6">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase">Nombre del Grupo</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Opción" value={optName} onChange={e => setOptName(e.target.value)} className="h-10 rounded-xl" />
            <Input type="number" placeholder="$" value={optPrice || ''} onChange={e => setOptPrice(Number(e.target.value))} className="h-10 rounded-xl" />
          </div>
          <Button variant="secondary" className="w-full rounded-xl font-bold uppercase text-[10px]" onClick={addOption}>Vincular Opción</Button>
          <div className="flex flex-wrap gap-2">
            {options.map((o, i) => <Badge key={i} className="gap-1 px-3 h-8 rounded-lg">{o.name} (${o.price}) <X className="h-3 w-3 cursor-pointer" onClick={() => setOptions(options.filter((_, idx) => idx !== i))} /></Badge>)}
          </div>
          <Button className="w-full h-12 font-black rounded-xl" onClick={save} disabled={loading}>{editingId ? 'GUARDAR CAMBIOS' : 'CREAR GRUPO'}</Button>
          {editingId && <Button variant="ghost" className="w-full text-[8px] font-black uppercase" onClick={() => {setEditingId(null); setName(''); setOptions([]);}}>Cancelar</Button>}
        </div>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {modifiers.map(m => (
              <div key={m.id} className="flex justify-between items-center p-3 border-2 rounded-xl bg-white group">
                <div>
                  <h4 className="font-black text-xs uppercase italic">{m.name}</h4>
                  <p className="text-[8px] font-bold text-muted-foreground">{m.options.length} opciones</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setEditingId(m.id!); setName(m.name); setOptions(m.options);}}><Edit2 className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                     const docRef = doc(db, 'orgs', orgId, 'locations', locId, 'modifiers', m.id!);
                     deleteDoc(docRef).catch(async () => {
                       errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
                     });
                  }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function DiscountsManager({ discounts, orgId, locId }: { discounts: Discount[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Discount>>({ name: '', value: 0, type: 'porcentaje' });

  const save = () => {
    if (!form.name || !form.value) return;
    const colRef = collection(db, 'orgs', orgId, 'locations', locId, 'discounts');
    addDoc(colRef, { ...form, updatedAt: Date.now() })
      .then(() => {
        setForm({ name: '', value: 0, type: 'porcentaje' });
        toast({ title: "Descuento activado" });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: form }));
      });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="rounded-[2rem] border-2 shadow-xl overflow-hidden flex flex-col justify-center p-6 border-dashed border-primary/40 bg-primary/5">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase">Nombre Promo</Label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-10 rounded-xl bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Valor</Label>
                <Input type="number" value={form.value || ''} onChange={e => setForm({...form, value: Number(e.target.value)})} className="h-10 rounded-xl bg-white" />
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Tipo</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({...form, type: v})}>
                   <SelectTrigger className="h-10 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="porcentaje">%</SelectItem>
                      <SelectItem value="monto">$</SelectItem>
                   </SelectContent>
                </Select>
             </div>
          </div>
          <Button className="w-full h-12 font-black rounded-xl" onClick={save}>CREAR PROMO</Button>
        </div>
      </Card>
      {discounts.map(d => (
        <Card key={d.id} className="bg-white border-2 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 group relative shadow-sm h-[180px]">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
             const docRef = doc(db, 'orgs', orgId, 'locations', locId, 'discounts', d.id!);
             deleteDoc(docRef).catch(async () => {
               errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
             });
          }}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <h5 className="font-black uppercase italic text-xs tracking-tighter text-muted-foreground">{d.name}</h5>
          <div className="text-4xl font-black text-primary">
             {d.type === 'porcentaje' ? `${d.value}%` : `$${d.value}`}
          </div>
        </Card>
      ))}
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

  const saveStaffUser = () => {
    if (!newUser.name || !newUser.email || !newUser.pin) {
      toast({ variant: 'destructive', title: 'Faltan datos' });
      return;
    }
    setLoading(true);
    const path = collection(db, 'orgs', orgId, 'users');
    const cleanData = {
      name: newUser.name || '',
      email: newUser.email || '',
      role: newUser.role || 'cashier',
      pin: newUser.pin || '',
      allowedLocIds: newUser.allowedLocIds || [locId],
      orgId,
      updatedAt: Date.now()
    };

    if (editingId) {
      const docRef = doc(path, editingId);
      updateDoc(docRef, cleanData)
        .then(() => {
          setNewUser(initialStaffState);
          setEditingId(null);
          toast({ title: "Equipo actualizado" });
        })
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: cleanData }));
        })
        .finally(() => setLoading(false));
    } else {
      addDoc(path, { ...cleanData, uid: `STAFF-${Date.now()}`, createdAt: Date.now() })
        .then(() => {
          setNewUser(initialStaffState);
          toast({ title: "Personal añadido" });
        })
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: path.path, operation: 'create', requestResourceData: cleanData }));
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border-t-8 border-t-primary shadow-xl rounded-[2rem] overflow-hidden border-2">
        <CardHeader className="bg-muted/30"><CardTitle className="font-black uppercase italic tracking-tighter text-2xl">{editingId ? 'EDITAR PERSONAL' : 'NUEVO PERSONAL'}</CardTitle></CardHeader>
        <CardContent className="space-y-6 pt-8">
           <div className="space-y-4">
              <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase">Nombre</Label>
                 <Input value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase">Email</Label>
                 <Input value={newUser.email || ''} onChange={e => setNewUser({...newUser, email: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase">Rol</Label>
                    <Select value={newUser.role} onValueChange={(v: any) => setNewUser({...newUser, role: v})}>
                       <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                          <SelectItem value="cashier">Cajero</SelectItem>
                          <SelectItem value="kitchen">Cocina</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase">PIN POS (4 dígitos)</Label>
                    <Input placeholder="1234" maxLength={4} value={newUser.pin || ''} onChange={e => setNewUser({...newUser, pin: e.target.value})} className="h-12 rounded-xl font-black tracking-widest text-center" />
                 </div>
              </div>
              <Button className="w-full h-16 font-black text-xl shadow-2xl rounded-2xl" onClick={saveStaffUser} disabled={loading}>GUARDAR PERSONAL</Button>
           </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-2 shadow-xl h-fit overflow-hidden">
        <CardContent className="p-6">
           <ScrollArea className="h-[450px]">
              <div className="space-y-3">
                 {staff.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-4 border-2 rounded-[1.25rem] bg-white group hover:border-primary transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary border-2 border-primary/20">{u.name?.charAt(0)}</div>
                          <div>
                             <h4 className="font-black text-sm uppercase leading-none">{u.name}</h4>
                             <Badge variant="secondary" className="text-[8px] mt-1 uppercase">{u.role}</Badge>
                          </div>
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => {setNewUser(u); setEditingId(u.id!);}}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive rounded-full" onClick={() => {
                             const docRef = doc(db, 'orgs', orgId, 'users', u.id!);
                             deleteDoc(docRef).catch(async () => {
                               errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
                             });
                          }}><Trash2 className="h-4 w-4" /></Button>
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

function ConfigManager({ location, orgId, locId, allLocations }: { location?: Location, orgId: string, locId: string, allLocations: Location[] }) {
  const db = useFirestore();
  const { setLoc } = useTenant();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Location>>({ 
    name: '', address: '', phoneNumber: '', taxRate: 0, cardFee: 0, 
    logo: '', websiteUrl: '', ticketHeader: '', ticketFooter: '' 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    if (location) {
      setForm({
        name: location.name || '',
        address: location.address || '',
        phoneNumber: location.phoneNumber || '',
        taxRate: location.taxRate || 0,
        cardFee: location.cardFee || 0,
        logo: location.logo || '',
        websiteUrl: location.websiteUrl || '',
        ticketHeader: location.ticketHeader || '',
        ticketFooter: location.ticketFooter || ''
      });
    }
  }, [location]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, logo: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const save = () => {
    if (!locId) return;
    setLoading(true);
    const docRef = doc(db, 'orgs', orgId, 'locations', locId);
    updateDoc(docRef, { ...form, updatedAt: Date.now() })
      .then(() => {
        toast({ title: "Configuración actualizada" });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: form }));
      })
      .finally(() => setLoading(false));
  };

  const createNewLocation = async () => {
    const name = prompt("Nombre de la nueva sucursal:");
    if (!name) return;
    const colRef = collection(db, 'orgs', orgId, 'locations');
    addDoc(colRef, {
      name,
      createdAt: Date.now(),
      taxRate: 0,
      cardFee: 0,
      address: '',
      phoneNumber: ''
    })
      .then(() => {
        toast({ title: "Sucursal creada" });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create' }));
      });
  };

  const deleteLocation = async (id: string, name: string) => {
    if (id === locId) {
      toast({ variant: 'destructive', title: 'Acción bloqueada', description: 'No puedes eliminar la sucursal activa.' });
      return;
    }
    
    // Usamos un sistema de confirmación más robusto para debug
    const confirmDelete = window.confirm(`¿Está seguro de que desea eliminar la sucursal "${name}"?`);
    if (!confirmDelete) return;

    const docRef = doc(db, 'orgs', orgId, 'locations', id);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Sede eliminada con éxito" });
      })
      .catch(async (error) => {
        console.error("Error deleting location:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
      });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
       <Card className="rounded-[2rem] border-2 shadow-xl overflow-hidden h-fit">
          <CardHeader className="bg-muted/30 border-b">
             <div className="flex justify-between items-center">
                <CardTitle className="font-black uppercase italic text-xl flex items-center gap-2"><Building2 className="h-5 w-5" /> Sedes</CardTitle>
                <Button size="sm" onClick={createNewLocation} className="rounded-xl h-8 px-4 font-black"><Plus className="h-4 w-4 mr-1" /> AÑADIR</Button>
             </div>
          </CardHeader>
          <CardContent className="p-6">
             <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-2">
                   {allLocations.map(l => (
                      <div key={l.id} className="group relative flex items-center gap-2">
                        <Button 
                          variant={l.id === locId ? 'default' : 'outline'} 
                          className="flex-1 h-16 justify-between rounded-xl px-4 border-2 overflow-hidden"
                          onClick={() => setLoc(l)}
                        >
                          <div className="text-left">
                             <div className="font-black text-xs uppercase truncate max-w-[120px]">{l.name}</div>
                             <div className="text-[8px] font-bold opacity-60 truncate max-w-[120px]">{l.address || 'Ubicación central'}</div>
                          </div>
                          {l.id === locId && <Badge className="bg-white text-primary text-[8px] font-black">ACTIVA</Badge>}
                        </Button>
                        
                        {l.id !== locId && (
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-12 w-12 text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                e.preventDefault();
                                deleteLocation(l.id, l.name); 
                              }}
                           >
                              <Trash2 className="h-5 w-5" />
                           </Button>
                        )}
                      </div>
                   ))}
                </div>
             </ScrollArea>
          </CardContent>
       </Card>

       <Card className="rounded-[2rem] border-2 shadow-xl overflow-hidden h-fit">
          <CardHeader className="bg-muted/30 border-b"><CardTitle className="font-black uppercase italic text-xl flex items-center gap-2"><CreditCard className="h-5 w-5" /> Finanzas</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-4">
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Nombre de Sucursal</Label>
                <Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <Label className="text-[10px] font-black uppercase">IVA / TAX (%)</Label>
                   <Input type="number" value={form.taxRate ?? 0} onChange={e => setForm({...form, taxRate: Number(e.target.value)})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1">
                   <Label className="text-[10px] font-black uppercase">Comisión Tarjeta (%)</Label>
                   <Input type="number" value={form.cardFee ?? 0} onChange={e => setForm({...form, cardFee: Number(e.target.value)})} className="h-12 rounded-xl" />
                </div>
             </div>
             <Button className="w-full h-16 font-black text-xl shadow-2xl rounded-2xl mt-4" onClick={save} disabled={loading}>GUARDAR FINANZAS</Button>
          </CardContent>
       </Card>

       <Card className="rounded-[2rem] border-2 shadow-xl overflow-hidden h-fit">
          <CardHeader className="bg-muted/30 border-b"><CardTitle className="font-black uppercase italic text-xl flex items-center gap-2"><Receipt className="h-5 w-5" /> Ticket POS</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Logo del Ticket</Label>
                <div className="flex gap-4 items-center">
                   <div className="w-16 h-16 rounded-xl border-2 flex items-center justify-center bg-muted overflow-hidden">
                      {form.logo ? <img src={form.logo} className="w-full h-full object-cover" /> : <ImageIcon className="h-6 w-6 opacity-20" />}
                   </div>
                   <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={handleLogoChange} className="h-10 text-[8px] font-black rounded-xl file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[8px] file:font-black file:bg-primary file:text-white" />
                   </div>
                </div>
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Dirección Física</Label>
                <div className="relative">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="h-12 pl-12 rounded-xl" />
                </div>
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Teléfono de Contacto</Label>
                <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input value={form.phoneNumber || ''} onChange={e => setForm({...form, phoneNumber: e.target.value})} className="h-12 pl-12 rounded-xl" />
                </div>
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Enlace para QR (Menú/Web)</Label>
                <div className="relative">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input value={form.websiteUrl || ''} onChange={e => setForm({...form, websiteUrl: e.target.value})} placeholder="https://miweb.com" className="h-12 pl-12 rounded-xl" />
                </div>
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Encabezado Mensaje</Label>
                <Textarea value={form.ticketHeader || ''} onChange={e => setForm({...form, ticketHeader: e.target.value})} className="min-h-[80px] rounded-xl text-xs" />
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Pie de Página / Comentarios</Label>
                <Textarea value={form.ticketFooter || ''} onChange={e => setForm({...form, ticketFooter: e.target.value})} className="min-h-[80px] rounded-xl text-xs" />
             </div>
             <Button className="w-full h-16 font-black text-xl shadow-2xl rounded-2xl mt-4" onClick={save} disabled={loading}>GUARDAR TICKET</Button>
          </CardContent>
       </Card>
    </div>
  );
}

