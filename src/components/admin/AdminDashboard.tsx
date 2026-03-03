
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore, useCollection, useDoc, useTenant, useMemoFirebase, useAuth } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Plus, Trash2, Package, Loader2, Edit2, 
  X, ArrowLeft, Users, Settings, Store, LogOut, KeyRound, 
  Tag, Image as ImageIcon, ClipboardList, Receipt, ChevronRight, Save, 
  Layers, Sliders, Percent, Barcode, Box
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItem, UserProfile, Location, Category, ModifierGroup, Discount, TpvShape } from '@/lib/types';
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

  const { data: items } = useCollection<MenuItem>(itemsQuery);
  const { data: categories } = useCollection<Category>(categoriesQuery);
  const { data: modifiers } = useCollection<ModifierGroup>(modifiersQuery);
  const { data: discounts } = useCollection<Discount>(discountsQuery);
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
        <Tabs defaultValue="articulos" className="space-y-6 max-w-7xl mx-auto">
          <TabsList className="bg-white border-2 shadow-sm w-full h-16 p-2 gap-2 rounded-[1.25rem] overflow-x-auto no-scrollbar">
            <TabsTrigger value="articulos" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl min-w-[120px]"><Package className="h-4 w-4" /> Artículos</TabsTrigger>
            <TabsTrigger value="categorias" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl min-w-[120px]"><Layers className="h-4 w-4" /> Categorías</TabsTrigger>
            <TabsTrigger value="modificadores" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl min-w-[120px]"><Sliders className="h-4 w-4" /> Modificadores</TabsTrigger>
            <TabsTrigger value="descuentos" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl min-w-[120px]"><Percent className="h-4 w-4" /> Descuentos</TabsTrigger>
            <TabsTrigger value="personal" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl min-w-[120px]"><Users className="h-4 w-4" /> Equipo</TabsTrigger>
            <TabsTrigger value="config" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-tighter rounded-xl min-w-[120px]"><Settings className="h-4 w-4" /> Config</TabsTrigger>
          </TabsList>

          <TabsContent value="articulos">
            <ArticulosManager items={items || []} categories={categories || []} modifiers={modifiers || []} orgId={orgId!} locId={locId!} />
          </TabsContent>

          <TabsContent value="categorias">
            <CategoriasManager categories={categories || []} orgId={orgId!} locId={locId!} />
          </TabsContent>

          <TabsContent value="modificadores">
            <ModifiersManager modifiers={modifiers || []} orgId={orgId!} locId={locId!} />
          </TabsContent>

          <TabsContent value="descuentos">
            <DiscountsManager discounts={discounts || []} orgId={orgId!} locId={locId!} />
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

  const save = async () => {
    if (!form.name || !form.category) {
      toast({ variant: 'destructive', title: 'Faltan datos', description: 'Nombre y categoría obligatorios.' });
      return;
    }
    setLoading(true);
    try {
      const data = { ...form, updatedAt: Date.now() };
      delete (data as any).id;
      const colRef = collection(db, 'orgs', orgId, 'locations', locId, 'menuItems');
      if (editingId) await updateDoc(doc(colRef, editingId), data);
      else await addDoc(colRef, { ...data, createdAt: Date.now() });
      setForm(initialState);
      setEditingId(null);
      toast({ title: "Guardado correctamente" });
    } catch (e) { toast({ variant: 'destructive', title: "Error al guardar" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <Card className="rounded-[2rem] border-2 border-t-8 border-t-primary shadow-xl">
        <CardHeader><CardTitle className="font-black uppercase italic tracking-tighter text-2xl">{editingId ? 'EDITAR ARTÍCULO' : 'NUEVO ARTÍCULO'}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Nombre Comercial *</Label>
              <Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Precio Venta ($)</Label>
                <Input type="number" value={form.price || ''} onChange={e => setForm({...form, price: Number(e.target.value)})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Costo ($)</Label>
                <Input type="number" value={form.cost || ''} onChange={e => setForm({...form, cost: Number(e.target.value)})} className="h-12 rounded-xl" />
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
                  <SelectItem value="unidad">Por Unidad</SelectItem>
                  <SelectItem value="peso">Por Peso (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase"><Barcode className="h-3 w-3 inline mr-1" /> Código de Barras</Label>
                <Input value={form.barcode || ''} onChange={e => setForm({...form, barcode: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Referencia</Label>
                <Input value={form.reference || ''} onChange={e => setForm({...form, reference: e.target.value})} className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="p-4 bg-muted/20 rounded-2xl border-2 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase flex items-center gap-2"><Box className="h-3 w-3" /> Controlar Inventario</Label>
                <Checkbox checked={form.trackInventory} onCheckedChange={v => setForm({...form, trackInventory: !!v})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Stock Disponible</Label>
                <Input type="number" disabled={!form.trackInventory} value={form.inventoryCount || 0} onChange={e => setForm({...form, inventoryCount: Number(e.target.value)})} className="h-10 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase">Imagen URL</Label>
              <Input value={form.image || ''} onChange={e => setForm({...form, image: e.target.value})} placeholder="https://..." className="h-12 rounded-xl" />
            </div>
          </div>

          <div className="space-y-4 border-l pl-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Color TPV</Label>
                <Input type="color" value={form.tpvColor} onChange={e => setForm({...form, tpvColor: e.target.value})} className="h-12 w-full rounded-xl cursor-pointer" />
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
              <Label className="text-[10px] font-black uppercase">Modificadores Aplicables</Label>
              <div className="grid grid-cols-2 gap-2">
                {modifiers.map(m => (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    <Checkbox 
                      checked={form.modifierIds?.includes(m.id!)} 
                      onCheckedChange={v => {
                        const ids = form.modifierIds || [];
                        if (v) setForm({...form, modifierIds: [...ids, m.id!]});
                        else setForm({...form, modifierIds: ids.filter(id => id !== m.id)});
                      }}
                    />
                    <span>{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full h-16 font-black text-xl shadow-2xl shadow-primary/20 rounded-2xl" onClick={save} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : editingId ? 'ACTUALIZAR' : 'CREAR ARTÍCULO'}
            </Button>
            {editingId && <Button variant="ghost" className="w-full font-bold" onClick={() => {setEditingId(null); setForm(initialState);}}>CANCELAR</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <Card key={item.id} className="rounded-2xl border-2 hover:border-primary transition-all group overflow-hidden bg-white">
            <div className="p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl border-2 flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: item.tpvColor }}>
                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="h-6 w-6 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm uppercase italic truncate">{item.name}</h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">{item.category}</p>
                <p className="font-black text-primary text-md">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => {setForm(item); setEditingId(item.id!);}}><Edit2 className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-full" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'locations', locId, 'menuItems', item.id!))}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CategoriasManager({ categories, orgId, locId }: { categories: Category[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', color: '#B8732E' });

  const save = async () => {
    if (!form.name) return;
    try {
      await addDoc(collection(db, 'orgs', orgId, 'locations', locId, 'categories'), form);
      setForm({ name: '', color: '#B8732E' });
      toast({ title: "Categoría creada" });
    } catch (e) { toast({ variant: 'destructive', title: "Error" }); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="rounded-[2rem] border-2 shadow-xl h-fit">
        <CardHeader><CardTitle className="font-black uppercase italic tracking-tighter">NUEVA CATEGORÍA</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase">Nombre</Label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase">Color de Identificación</Label>
            <Input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="h-12 w-full cursor-pointer" />
          </div>
          <Button className="w-full h-14 font-black rounded-2xl" onClick={save}>AGREGAR CATEGORÍA</Button>
        </CardContent>
      </Card>
      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white border-2 rounded-2xl p-4 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="font-black uppercase text-xs italic tracking-tighter">{cat.name}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'locations', locId, 'categories', cat.id!))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModifiersManager({ modifiers, orgId, locId }: { modifiers: ModifierGroup[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [options, setOptions] = useState<{name: string, price: number}[]>([]);
  const [optName, setOptName] = useState('');
  const [optPrice, setOptPrice] = useState(0);

  const addOption = () => {
    if (!optName) return;
    setOptions([...options, { name: optName, price: optPrice }]);
    setOptName(''); setOptPrice(0);
  };

  const save = async () => {
    if (!name || options.length === 0) return;
    try {
      await addDoc(collection(db, 'orgs', orgId, 'locations', locId, 'modifiers'), { name, options });
      setName(''); setOptions([]);
      toast({ title: "Grupo de modificadores guardado" });
    } catch (e) { toast({ variant: 'destructive' }); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="rounded-[2rem] border-2 shadow-xl">
        <CardHeader><CardTitle className="font-black uppercase italic tracking-tighter">NUEVO MODIFICADOR</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase">Nombre del Grupo (ej. Extras)</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="p-4 bg-muted/30 rounded-2xl space-y-4">
            <p className="text-[10px] font-black uppercase text-center border-b pb-2">Agregar Opciones</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Nombre" value={optName} onChange={e => setOptName(e.target.value)} className="h-10 rounded-xl" />
              <Input type="number" placeholder="$" value={optPrice || ''} onChange={e => setOptPrice(Number(e.target.value))} className="h-10 rounded-xl" />
            </div>
            <Button variant="secondary" className="w-full rounded-xl font-bold" onClick={addOption}>VINCULAR OPCIÓN</Button>
            <div className="space-y-2">
              {options.map((o, i) => (
                <div key={i} className="flex justify-between text-xs font-bold bg-white p-2 rounded-lg">
                  <span>{o.name}</span>
                  <span className="text-primary">+${o.price}</span>
                </div>
              ))}
            </div>
          </div>
          <Button className="w-full h-14 font-black rounded-2xl" onClick={save}>GUARDAR GRUPO</Button>
        </CardContent>
      </Card>
      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        {modifiers.map(m => (
          <Card key={m.id} className="rounded-2xl border-2 p-6 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-4 right-4"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'locations', locId, 'modifiers', m.id!))}><Trash2 className="h-4 w-4" /></Button></div>
            <h4 className="font-black uppercase italic text-lg mb-4 text-primary">{m.name}</h4>
            <div className="flex flex-wrap gap-2">
              {m.options.map((o, i) => <Badge key={i} variant="outline" className="font-bold">{o.name} (+${o.price})</Badge>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DiscountsManager({ discounts, orgId, locId }: { discounts: Discount[], orgId: string, locId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Discount>>({ name: '', value: 0, type: 'porcentaje' });

  const save = async () => {
    if (!form.name || !form.value) return;
    try {
      await addDoc(collection(db, 'orgs', orgId, 'locations', locId, 'discounts'), form);
      setForm({ name: '', value: 0, type: 'porcentaje' });
      toast({ title: "Descuento configurado" });
    } catch (e) { toast({ variant: 'destructive' }); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="rounded-[2rem] border-2 shadow-xl">
        <CardHeader><CardTitle className="font-black uppercase italic tracking-tighter">NUEVO DESCUENTO</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase">Nombre del Descuento</Label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Valor</Label>
                <Input type="number" value={form.value || ''} onChange={e => setForm({...form, value: Number(e.target.value)})} className="h-12 rounded-xl" />
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Tipo</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({...form, type: v})}>
                   <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                      <SelectItem value="monto">Efectivo ($)</SelectItem>
                   </SelectContent>
                </Select>
             </div>
          </div>
          <Button className="w-full h-14 font-black rounded-2xl" onClick={save}>ACTIVAR DESCUENTO</Button>
        </CardContent>
      </Card>
      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
        {discounts.map(d => (
          <div key={d.id} className="bg-white border-2 rounded-2xl p-6 flex flex-col items-center gap-2 group relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteDoc(doc(db, 'orgs', orgId, 'locations', locId, 'discounts', d.id!))}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <h5 className="font-black uppercase italic text-xs tracking-tighter">{d.name}</h5>
            <div className="text-3xl font-black text-primary">
               {d.type === 'porcentaje' ? `${d.value}%` : `$${d.value}`}
            </div>
          </div>
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
