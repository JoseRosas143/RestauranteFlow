
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
import { Plus, Trash2, Package, Tag, Layers, Percent, Loader2, Save, Settings, Edit2, X, ImageIcon, ArrowLeft } from 'lucide-react';
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
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </Button>
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

  const saveItem = async () => {
    if (!newItem.name || newItem.price === undefined) {
      toast({ variant: 'destructive', title: "Faltan datos", description: "Nombre y precio son obligatorios." });
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
        toast({ title: "Artículo Actualizado", description: `${newItem.name} se guardó correctamente.` });
      } else {
        await addDoc(collection(db, 'menu'), {
          ...itemData,
          createdAt: Date.now()
        });
        toast({ title: "Artículo Guardado", description: `${newItem.name} se agregó al catálogo.` });
      }
      resetForm();
    } catch (e) {
      toast({ variant: 'destructive', title: "Error al guardar", description: "Hubo un problema al conectar con Firestore." });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'menu', id));
      toast({ title: "Artículo Eliminado" });
    } catch (e) {
      toast({ variant: 'destructive', title: "No se pudo eliminar" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-md border-primary/20">
        <CardHeader className="bg-primary/5 border-b mb-4 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl">{editingId ? 'Editar Artículo' : 'Nuevo Artículo'}</CardTitle>
            <CardDescription>{editingId ? 'Modifica los datos del producto' : 'Crea un producto para tu terminal de venta.'}</CardDescription>
          </div>
          {editingId && (
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Plato/Bebida</Label>
            <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Ej: Choripán Especial" className="h-11" />
          </div>
          
          <div className="space-y-2">
            <Label>URL de la Foto</Label>
            <div className="flex gap-2">
              <Input value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} placeholder="https://..." className="flex-1" />
              <div className="h-10 w-10 border rounded flex items-center justify-center bg-muted overflow-hidden">
                {newItem.image ? (
                  <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select onValueChange={v => setNewItem({...newItem, category: v})} value={newItem.category}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vendido por</Label>
              <Select onValueChange={(v: SoldBy) => setNewItem({...newItem, soldBy: v})} value={newItem.soldBy}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Unidad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidad">Unidad</SelectItem>
                  <SelectItem value="peso">Peso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Precio de Venta ($)</Label>
              <Input type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Coste ($)</Label>
              <Input type="number" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: Number(e.target.value)})} className="h-11" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Referencia / SKU</Label>
              <Input value={newItem.reference} onChange={e => setNewItem({...newItem, reference: e.target.value})} placeholder="SKU-123" />
            </div>
            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <Input value={newItem.barcode} onChange={e => setNewItem({...newItem, barcode: e.target.value})} placeholder="789..." />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-dashed">
            <div className="space-y-0.5">
              <Label className="text-base">Seguir Inventario</Label>
              <p className="text-xs text-muted-foreground">Controlar stock disponible</p>
            </div>
            <Switch checked={newItem.trackInventory} onCheckedChange={v => setNewItem({...newItem, trackInventory: v})} />
          </div>
          {newItem.trackInventory && (
            <div className="space-y-2">
              <Label>Piezas en Stock inicial</Label>
              <Input type="number" value={newItem.inventoryCount} onChange={e => setNewItem({...newItem, inventoryCount: Number(e.target.value)})} className="h-11" />
            </div>
          )}
          <div className="space-y-3 pt-4 border-t">
            <Label className="flex items-center gap-2"><Settings className="h-4 w-4" /> Apariencia en TPV</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Color</span>
                <Input type="color" value={newItem.tpvColor} onChange={e => setNewItem({...newItem, tpvColor: e.target.value})} className="h-10 p-1 cursor-pointer" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Forma</span>
                <Select onValueChange={(v: TpvShape) => setNewItem({...newItem, tpvShape: v})} value={newItem.tpvShape}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Forma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cuadrado">Cuadrado</SelectItem>
                    <SelectItem value="circulo">Círculo</SelectItem>
                    <SelectItem value="hexágono">Hexágono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            {editingId && (
              <Button variant="outline" className="flex-1 h-12" onClick={resetForm}>
                Cancelar
              </Button>
            )}
            <Button className="flex-[2] h-12 text-lg font-bold" onClick={saveItem} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {editingId ? 'Guardar Cambios' : 'Guardar Artículo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lista de Artículos</CardTitle>
            <CardDescription>{items.length} productos registrados.</CardDescription>
          </div>
          <Badge variant="outline" className="h-6">Sincronizado</Badge>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[650px] pr-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground opacity-50 border-2 border-dashed rounded-xl">
                <Package className="h-12 w-12 mb-2" />
                <p>No hay artículos registrados todavía.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/10 transition-colors group">
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div 
                          className="w-12 h-12 shadow-sm border flex items-center justify-center text-white font-black text-xl"
                          style={{ 
                            backgroundColor: item.tpvColor || '#B8732E', 
                            borderRadius: item.tpvShape === 'circulo' ? '50%' : item.tpvShape === 'hexágono' ? '12px' : '8px' 
                          }}
                        >
                          {item.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-base truncate max-w-[150px]">{item.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-semibold text-primary">{item.category}</span>
                          <span>•</span>
                          <span>${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(item)} className="text-primary">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id!)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
      <Card className="shadow-md">
        <CardHeader><CardTitle>Nueva Categoría</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la Categoría</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Bebidas Frías" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Color de Identificación</Label>
            <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-12 p-1 cursor-pointer" />
          </div>
          <Button className="w-full h-11" onClick={save}><Plus className="mr-2 h-4 w-4" /> Crear Categoría</Button>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
        {categories.map(c => (
          <Card key={c.id} className="overflow-hidden border-l-[8px]" style={{ borderLeftColor: c.color }}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <span className="font-bold text-lg">{c.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db, 'categories', c.id!))} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
      <Card className="shadow-md">
        <CardHeader><CardTitle>Nuevo Modificador</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Grupo</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Extras" className="h-11" />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold flex justify-between">Opciones y Precios Extra <Plus className="h-3 w-3 cursor-pointer" onClick={addOption}/></Label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <Input placeholder="Opción" value={opt.name} onChange={e => {
                  const n = [...options]; n[idx].name = e.target.value; setOptions(n);
                }} className="flex-1" />
                <Input type="number" placeholder="+$" className="w-24" value={opt.price} onChange={e => {
                  const n = [...options]; n[idx].price = Number(e.target.value); setOptions(n);
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption} className="w-full text-xs font-bold border-dashed"><Plus className="h-3 w-3 mr-1" /> Añadir otra opción</Button>
          </div>
          <Button className="w-full h-11" onClick={save}>Guardar Modificadores</Button>
        </CardContent>
      </Card>
      <div className="space-y-4 h-[600px] overflow-auto pr-2">
        {modifiers.map(m => (
          <Card key={m.id} className="shadow-sm">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base font-bold text-primary">{m.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db, 'modifiers', m.id!))} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {m.options.map((o, i) => (
                  <Badge key={i} variant="secondary">${o.price.toFixed(2)} • {o.name}</Badge>
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
    await addDoc(collection(db, 'discounts'), { name, value: Number(value), type });
    setName('');
    setValue(0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="shadow-md">
        <CardHeader><CardTitle>Nueva Regla de Descuento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del Descuento</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Amigo de la Casa" className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" value={value} onChange={e => setValue(Number(e.target.value))} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <TypeSelect onValueChange={(v: DiscountType) => setType(v)} value={type}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Porcentaje" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                  <SelectItem value="monto">Cantidad Fija ($)</SelectItem>
                </SelectContent>
              </TypeSelect>
            </div>
          </div>
          <Button className="w-full h-11" onClick={save}>Crear Descuento</Button>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {discounts.map(d => (
          <Card key={d.id} className="border-l-4 border-l-green-500">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <div className="font-bold text-lg">{d.name}</div>
                <Badge variant="outline" className="text-green-600">
                  {d.type === 'porcentaje' ? `${d.value}%` : `$${d.value}`}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db, 'discounts', d.id!))} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Named alias to avoid shadowing issues with local state 'type'
const TypeSelect = Select;
