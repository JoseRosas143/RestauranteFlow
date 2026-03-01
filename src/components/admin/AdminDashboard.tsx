
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
import { collection, addDoc, deleteDoc, doc, query, limit, getDocs } from 'firebase/firestore';
import { Plus, Trash2, Package, Tag, Layers, Percent, Database, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItem, Category, Modifier, Discount, SoldBy, TpvShape, DiscountType } from '@/lib/types';
import { INITIAL_MENU } from '@/lib/mock-data';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const { data: items } = useCollection<MenuItem>(collection(db, 'menu'));
  const { data: categories } = useCollection<Category>(collection(db, 'categories'));
  const { data: modifiers } = useCollection<Modifier>(collection(db, 'modifiers'));
  const { data: discounts } = useCollection<Discount>(collection(db, 'discounts'));

  useEffect(() => {
    setMounted(true);
  }, []);

  const seedData = async () => {
    setIsSeeding(true);
    try {
      const menuRef = collection(db, 'menu');
      const snap = await getDocs(query(menuRef, limit(1)));
      if (!snap.empty) {
        toast({ title: "Datos ya existentes", description: "El catálogo ya contiene información." });
        setIsSeeding(false);
        return;
      }

      // Cargar categorías básicas
      const catPromises = ['Sándwiches', 'Entradas', 'Bebidas', 'Acompañamientos'].map(name => 
        addDoc(collection(db, 'categories'), { name, color: '#B8732E' })
      );
      await Promise.all(catPromises);

      // Cargar menú inicial
      const menuPromises = INITIAL_MENU.map(item => {
        const { id, ...data } = item;
        return addDoc(collection(db, 'menu'), {
          ...data,
          soldBy: 'unidad',
          trackInventory: false,
          tpvColor: '#B8732E',
          tpvShape: 'cuadrado'
        });
      });
      await Promise.all(menuPromises);

      toast({ title: "¡Éxito!", description: "Catálogo inicial cargado correctamente." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos." });
    } finally {
      setIsSeeding(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-white border-b px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Catálogo</h1>
          <p className="text-muted-foreground">Configura tus artículos, categorías y reglas de venta.</p>
        </div>
        <Button variant="outline" onClick={seedData} disabled={isSeeding}>
          {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
          Cargar Catálogo Inicial
        </Button>
      </header>

      <main className="flex-1 p-8">
        <Tabs defaultValue="articulos" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="articulos" className="gap-2"><Package className="h-4 w-4" /> Artículos</TabsTrigger>
            <TabsTrigger value="categorias" className="gap-2"><Layers className="h-4 w-4" /> Categorías</TabsTrigger>
            <TabsTrigger value="modificadores" className="gap-2"><Tag className="h-4 w-4" /> Modificadores</TabsTrigger>
            <TabsTrigger value="descuentos" className="gap-2"><Percent className="h-4 w-4" /> Descuentos</TabsTrigger>
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
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    cost: 0,
    category: '',
    soldBy: 'unidad',
    trackInventory: false,
    inventoryCount: 0,
    tpvColor: '#B8732E',
    tpvShape: 'cuadrado'
  });

  const saveItem = async () => {
    if (!newItem.name || !newItem.price) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'menu'), newItem);
      toast({ title: "Artículo Guardado" });
      setNewItem({ name: '', price: 0, cost: 0, category: '', soldBy: 'unidad', trackInventory: false, tpvColor: '#B8732E', tpvShape: 'cuadrado' });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error al guardar" });
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    await deleteDoc(doc(db, 'menu', id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle>Nuevo Artículo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Plato/Bebida</Label>
            <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Ej: Choripán Especial" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select onValueChange={v => setNewItem({...newItem, category: v})}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vendido por</Label>
              <Select onValueChange={(v: SoldBy) => setNewItem({...newItem, soldBy: v})}>
                <SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidad">Unidad</SelectItem>
                  <SelectItem value="peso">Peso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Precio de Venta</Label>
              <Input type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Coste</Label>
              <Input type="number" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: Number(e.target.value)})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Referencia / SKU</Label>
              <Input value={newItem.reference} onChange={e => setNewItem({...newItem, reference: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <Input value={newItem.barcode} onChange={e => setNewItem({...newItem, barcode: e.target.value})} />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label>Seguir Inventario</Label>
              <p className="text-xs text-muted-foreground">Controlar stock disponible</p>
            </div>
            <Switch checked={newItem.trackInventory} onCheckedChange={v => setNewItem({...newItem, trackInventory: v})} />
          </div>
          {newItem.trackInventory && (
            <div className="space-y-2">
              <Label>Piezas en Stock</Label>
              <Input type="number" value={newItem.inventoryCount} onChange={e => setNewItem({...newItem, inventoryCount: Number(e.target.value)})} />
            </div>
          )}
          <div className="space-y-2 pt-2 border-t">
            <Label>Representación TPV</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input type="color" value={newItem.tpvColor} onChange={e => setNewItem({...newItem, tpvColor: e.target.value})} className="h-10 p-1" />
              <Select onValueChange={(v: TpvShape) => setNewItem({...newItem, tpvShape: v})}>
                <SelectTrigger><SelectValue placeholder="Forma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cuadrado">Cuadrado</SelectItem>
                  <SelectItem value="circulo">Círculo</SelectItem>
                  <SelectItem value="hexágono">Hexágono</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full mt-4" onClick={saveItem} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Artículo
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Lista de Artículos ({items.length})</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/10">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-md border flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: item.tpvColor, borderRadius: item.tpvShape === 'circulo' ? '50%' : '8px' }}
                    >
                      {item.name[0]}
                    </div>
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.category} • ${item.price.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {item.trackInventory && (
                      <Badge variant="outline" className={item.inventoryCount! < 10 ? 'text-red-500 border-red-200 bg-red-50' : ''}>
                        Stock: {item.inventoryCount}
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id!)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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

function CategoriasManager({ categories }: { categories: Category[] }) {
  const db = useFirestore();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#B8732E');

  const save = async () => {
    if (!name) return;
    await addDoc(collection(db, 'categories'), { name, color });
    setName('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader><CardTitle>Nueva Categoría</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Bebidas Frías" />
          </div>
          <div className="space-y-2">
            <Label>Color de Identificación</Label>
            <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-12 p-1" />
          </div>
          <Button className="w-full" onClick={save}><Plus className="mr-2 h-4 w-4" /> Crear Categoría</Button>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        {categories.map(c => (
          <Card key={c.id} style={{ borderLeft: `6px solid ${c.color}` }}>
            <CardContent className="p-4 flex justify-between items-center">
              <span className="font-bold">{c.name}</span>
              <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db, 'categories', c.id!))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ModificadoresManager({ modifiers }: { modifiers: Modifier[] }) {
  const db = useFirestore();
  const [name, setName] = useState('');
  const [options, setOptions] = useState<{name: string, price: number}[]>([{name: '', price: 0}]);

  const addOption = () => setOptions([...options, {name: '', price: 0}]);
  
  const save = async () => {
    if (!name || options[0].name === '') return;
    await addDoc(collection(db, 'modifiers'), { name, options: options.filter(o => o.name !== '') });
    setName('');
    setOptions([{name: '', price: 0}]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader><CardTitle>Nuevo Modificador</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Grupo (Ej: Término de carne)</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-3">
            <Label>Opciones y Precios Extra</Label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <Input placeholder="Nombre" value={opt.name} onChange={e => {
                  const n = [...options]; n[idx].name = e.target.value; setOptions(n);
                }} />
                <Input type="number" placeholder="Precio" className="w-24" value={opt.price} onChange={e => {
                  const n = [...options]; n[idx].price = Number(e.target.value); setOptions(n);
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption} className="w-full"><Plus className="h-4 w-4 mr-2" /> Agregar Opción</Button>
          </div>
          <Button className="w-full" onClick={save}>Guardar Modificador</Button>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {modifiers.map(m => (
          <Card key={m.id}>
            <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">{m.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db, 'modifiers', m.id!))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-wrap gap-2">
                {m.options.map((o, i) => (
                  <Badge key={i} variant="secondary">{o.name} (+${o.price})</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DescuentosManager({ discounts }: { discounts: Discount[] }) {
  const db = useFirestore();
  const [name, setName] = useState('');
  const [value, setValue] = useState(0);
  const [type, setType] = useState<DiscountType>('porcentaje');

  const save = async () => {
    if (!name) return;
    await addDoc(collection(db, 'discounts'), { name, value, type });
    setName('');
    setValue(0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader><CardTitle>Nuevo Descuento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Descuento</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Amigo del Dueño" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" value={value} onChange={e => setValue(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select onValueChange={(v: DiscountType) => setType(v)}>
                <SelectTrigger><SelectValue placeholder="Porcentaje" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                  <SelectItem value="monto">Cantidad Fija ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" onClick={save}>Crear Regla de Descuento</Button>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {discounts.map(d => (
          <Card key={d.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <div className="font-bold">{d.name}</div>
                <div className="text-sm text-muted-foreground">Valor: {d.value}{d.type === 'porcentaje' ? '%' : '$'}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db, 'discounts', d.id!))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
