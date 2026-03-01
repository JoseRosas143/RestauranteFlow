
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Package, Tag, Layers, Percent, Loader2, Save, Settings, Edit2, X, ImageIcon, ArrowLeft, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItem, Category, Modifier, Discount, SoldBy, TpvShape, DiscountType } from '@/lib/types';
import Link from 'next/link';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();

  const { data: items } = useCollection<MenuItem>(collection(db, 'menu'));
  const { data: categories } = useCollection<Category>(collection(db, 'categories'));
  const { data: modifiers } = useCollection<Modifier>(collection(db, 'modifiers'));
  const { data: discounts } = useCollection<Discount>(collection(db, 'discounts'));

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-white border-b px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary">Gestión de Catálogo</h1>
            <p className="text-muted-foreground">Configura tus artículos, categorías y reglas de venta.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8">
        <Tabs defaultValue="articulos" className="space-y-6">
          <TabsList className="bg-white border shadow-sm w-full max-w-2xl">
            <TabsTrigger value="articulos" className="flex-1 gap-2"><Package className="h-4 w-4" /> Artículos</TabsTrigger>
            <TabsTrigger value="categorias" className="flex-1 gap-2"><Layers className="h-4 w-4" /> Categorías</TabsTrigger>
            <TabsTrigger value="modificadores" className="flex-1 gap-2"><Tag className="h-4 w-4" /> Modificadores</TabsTrigger>
            <TabsTrigger value="descuentos" className="flex-1 gap-2"><Percent className="h-4 w-4" /> Descuentos</TabsTrigger>
          </TabsList>

          <TabsContent value="articulos">
            <ArticulosManager items={items} categories={categories} />
          </TabsContent>

          <TabsContent value="categorias">
            <CategoriasManager categories={categories} />
          </TabsContent>

          <TabsContent value="modificadores">
            <ModificadoresManager modifiers={modifiers} />
          </TabsContent>

          <TabsContent value="descuentos">
            <DescuentosManager discounts={discounts} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ArticulosManager({ items, categories }: { items: MenuItem[], categories: Category[] }) {
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
        toast({ variant: 'destructive', title: "Imagen demasiado grande" });
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
      toast({ variant: 'destructive', title: "Faltan datos" });
      return;
    }
    setLoading(true);
    try {
      const itemData = {
        ...newItem,
        price: Number(newItem.price),
        cost: Number(newItem.cost || 0),
        inventoryCount: newItem.trackInventory ? Number(newItem.inventoryCount || 0) : 0,
        updatedAt: Date.now()
      };

      if (editingId) {
        await updateDoc(doc(db, 'menu', editingId), itemData);
        toast({ title: "Artículo Actualizado" });
      } else {
        await addDoc(collection(db, 'menu'), { ...itemData, createdAt: Date.now() });
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
    setNewItem(item);
    setEditingId(item.id!);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-md">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>{editingId ? 'Editar Artículo' : 'Nuevo Artículo'}</CardTitle>
          {editingId && <Button variant="ghost" size="icon" onClick={resetForm}><X /></Button>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
          </div>
          
          <div className="space-y-2">
            <Label>Foto</Label>
            <div className="border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center bg-muted overflow-hidden relative">
              {newItem.image ? (
                <>
                  <img src={newItem.image} className="w-full h-full object-cover" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setNewItem({...newItem, image: ''})}><X /></Button>
                </>
              ) : (
                <ImageIcon className="opacity-20 h-10 w-10" />
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={() => document.getElementById('file-up')?.click()}><Upload className="mr-2 h-4 w-4" /> Subir</Button>
            <input id="file-up" type="file" className="hidden" onChange={handleImageUpload} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select onValueChange={v => setNewItem({...newItem, category: v})} value={newItem.category}>
                <SelectTrigger><SelectValue placeholder="Cat" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vendido por</Label>
              <Select onValueChange={(v: SoldBy) => setNewItem({...newItem, soldBy: v})} value={newItem.soldBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="unidad">Unidad</SelectItem><SelectItem value="peso">Peso</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Precio ($)</Label>
              <Input type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Coste ($)</Label>
              <Input type="number" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: Number(e.target.value)})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Referencia</Label>
              <Input value={newItem.reference} onChange={e => setNewItem({...newItem, reference: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>EAN/Barra</Label>
              <Input value={newItem.barcode} onChange={e => setNewItem({...newItem, barcode: e.target.value})} />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label>Inventario</Label>
            <Switch checked={newItem.trackInventory} onCheckedChange={v => setNewItem({...newItem, trackInventory: v})} />
          </div>
          {newItem.trackInventory && <Input type="number" placeholder="Stock" value={newItem.inventoryCount} onChange={e => setNewItem({...newItem, inventoryCount: Number(e.target.value)})} />}
          
          <Button className="w-full h-12 font-bold" onClick={saveItem} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {editingId ? 'Actualizar' : 'Guardar'}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="p-2 opacity-20" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground">${item.price.toFixed(2)} • {item.category}</div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc(db, 'menu', item.id!))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoriasManager({ categories }: { categories: Category[] }) {
  const db = useFirestore();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#B8732E');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card><CardHeader><CardTitle>Nueva Categoría</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" />
        <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-12" />
        <Button className="w-full" onClick={() => addDoc(collection(db, 'categories'), { name, color })}><Plus className="mr-2 h-4 w-4" /> Crear</Button>
      </CardContent></Card>
      <div className="grid grid-cols-2 gap-4">{categories.map(c => (
        <Card key={c.id} className="border-l-8" style={{ borderLeftColor: c.color }}>
          <CardContent className="p-4 flex justify-between items-center"><span className="font-bold">{c.name}</span>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc(db, 'categories', c.id!))}><Trash2 className="h-4 w-4" /></Button>
        </CardContent></Card>
      ))}</div>
    </div>
  );
}

function ModificadoresManager({ modifiers }: { modifiers: Modifier[] }) {
  const db = useFirestore();
  const [name, setName] = useState('');
  const [options, setOptions] = useState<{name: string, price: number}[]>([{name: '', price: 0}]);
  const save = async () => {
    if (!name || options[0].name === '') return;
    await addDoc(collection(db, 'modifiers'), { name, options: options.filter(o => o.name !== '') });
    setName(''); setOptions([{name: '', price: 0}]);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card><CardHeader><CardTitle>Nuevo Modificador</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Grupo (ej: Toppings)" />
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="Opción" value={opt.name} onChange={e => {const n = [...options]; n[i].name = e.target.value; setOptions(n);}} />
            <Input type="number" placeholder="$" className="w-20" value={opt.price} onChange={e => {const n = [...options]; n[i].price = Number(e.target.value); setOptions(n);}} />
          </div>
        ))}
        <Button variant="outline" className="w-full" onClick={() => setOptions([...options, {name: '', price: 0}])}><Plus className="h-4 w-4" /> Añadir Opción</Button>
        <Button className="w-full" onClick={save}>Guardar</Button>
      </CardContent></Card>
      <div className="space-y-4">{modifiers.map(m => (
        <Card key={m.id}><CardHeader className="py-2"><CardTitle className="text-sm">{m.name}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-1 pb-4">{m.options.map((o, i) => (
          <Badge key={i} variant="secondary">+{o.name} (${o.price})</Badge>
        ))}</CardContent></Card>
      ))}</div>
    </div>
  );
}

function DescuentosManager({ discounts }: { discounts: Discount[] }) {
  const db = useFirestore();
  const [name, setName] = useState('');
  const [value, setValue] = useState(0);
  const [type, setType] = useState<DiscountType>('porcentaje');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card><CardHeader><CardTitle>Nueva Regla</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre Promo" />
        <div className="flex gap-2">
          <Input type="number" value={value} onChange={e => setValue(Number(e.target.value))} className="flex-1" />
          <Select value={type} onValueChange={(v: DiscountType) => setType(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="porcentaje">%</SelectItem><SelectItem value="monto">$ Cash</SelectItem></SelectContent>
          </Select>
        </div>
        <Button className="w-full" onClick={() => addDoc(collection(db, 'discounts'), { name, value, type })}>Crear</Button>
      </CardContent></Card>
      <div className="space-y-4">{discounts.map(d => (
        <Card key={d.id} className="bg-accent/5"><CardContent className="p-4 flex justify-between items-center">
          <div><div className="font-black">{d.name}</div><div className="text-xs">{d.type === 'porcentaje' ? `${d.value}%` : `$${d.value}`}</div></div>
          <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db, 'discounts', d.id!))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </CardContent></Card>
      ))}</div>
    </div>
  );
}
