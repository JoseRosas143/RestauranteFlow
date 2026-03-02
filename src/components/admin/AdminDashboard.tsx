
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
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, setDoc } from 'firebase/firestore';
import { 
  Plus, Trash2, Package, Tag, Layers, Percent, Loader2, Save, Edit2, 
  X, ImageIcon, ArrowLeft, Upload, Users, Mail, Phone, MapPin, 
  Star, ShoppingBag, Calendar, Settings 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItem, Category, Modifier, Discount, SoldBy, DiscountType, Customer, LoyaltySettings } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();
  const router = useRouter();

  const itemsQuery = useMemo(() => query(collection(db, 'menu'), orderBy('name', 'asc')), [db]);
  const categoriesQuery = useMemo(() => query(collection(db, 'categories'), orderBy('name', 'asc')), [db]);
  const modifiersQuery = useMemo(() => collection(db, 'modifiers'), [db]);
  const discountsQuery = useMemo(() => collection(db, 'discounts'), [db]);
  const customersQuery = useMemo(() => query(collection(db, 'customers'), orderBy('name', 'asc')), [db]);

  const { data: items } = useCollection<MenuItem>(itemsQuery);
  const { data: categories } = useCollection<Category>(categoriesQuery);
  const { data: modifiers } = useCollection<Modifier>(modifiersQuery);
  const { data: discounts } = useCollection<Discount>(discountsQuery);
  const { data: customers } = useCollection<Customer>(customersQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-white border-b px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Gestión de Catálogo</h1>
            <p className="text-muted-foreground">Configura tus artículos, clientes y reglas de venta.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8">
        <Tabs defaultValue="articulos" className="space-y-6">
          <TabsList className="bg-white border shadow-sm w-full max-w-4xl">
            <TabsTrigger value="articulos" className="flex-1 gap-2"><Package className="h-4 w-4" /> Artículos</TabsTrigger>
            <TabsTrigger value="categorias" className="flex-1 gap-2"><Layers className="h-4 w-4" /> Categorías</TabsTrigger>
            <TabsTrigger value="modificadores" className="flex-1 gap-2"><Tag className="h-4 w-4" /> Modificadores</TabsTrigger>
            <TabsTrigger value="descuentos" className="flex-1 gap-2"><Percent className="h-4 w-4" /> Descuentos</TabsTrigger>
            <TabsTrigger value="clientes" className="flex-1 gap-2"><Users className="h-4 w-4" /> Clientes</TabsTrigger>
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

          <TabsContent value="clientes">
            <ClientesManager customers={customers} />
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
      toast({ variant: 'destructive', title: "Error al guardar en base de datos" });
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
                  <img src={newItem.image} className="w-full h-full object-cover" alt="Preview" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setNewItem({...newItem, image: ''})}><X /></Button>
                </>
              ) : (
                <ImageIcon className="opacity-20 h-10 w-10" />
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={() => document.getElementById('file-up')?.click()}><Upload className="mr-2 h-4 w-4" /> Subir</Button>
            <input id="file-up" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
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
          {newItem.trackInventory && <Input type="number" placeholder="Stock disponible" value={newItem.inventoryCount} onChange={e => setNewItem({...newItem, inventoryCount: Number(e.target.value)})} />}
          
          <Button className="w-full h-12 font-bold" onClick={saveItem} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {editingId ? 'Actualizar Artículo' : 'Guardar Artículo'}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.name} /> : <Package className="p-2 opacity-20" />}
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

function ClientesManager({ customers }: { customers: Customer[] }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Configuración de Lealtad
  const loyaltyDocRef = useMemo(() => doc(db, 'settings', 'loyalty'), [db]);
  const { data: loyaltySettings } = useDoc<LoyaltySettings>(loyaltyDocRef);
  const [newPercentage, setNewPercentage] = useState<string>('');

  useEffect(() => {
    if (loyaltySettings) setNewPercentage(loyaltySettings.pointsPercentage.toString());
  }, [loyaltySettings]);

  const saveLoyaltySettings = async () => {
    try {
      await setDoc(loyaltyDocRef, { pointsPercentage: Number(newPercentage) });
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
      if (selectedCustomer && isEditing) {
        await updateDoc(doc(db, 'customers', selectedCustomer.id!), customerForm);
        toast({ title: "Cliente Actualizado" });
      } else {
        await addDoc(collection(db, 'customers'), { ...customerForm, createdAt: Date.now() });
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
      {/* Lista de Clientes */}
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Base de datos de fidelización</CardDescription>
          </div>
          <Button size="icon" variant="outline" onClick={() => { setSelectedCustomer(null); setIsEditing(false); setCustomerForm(initialCustomer); }}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-4">
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase text-primary">
                <Settings className="h-3 w-3" /> Configuración de Puntos
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input 
                    type="number" 
                    value={newPercentage} 
                    onChange={e => setNewPercentage(e.target.value)} 
                    placeholder="%"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                </div>
                <Button size="sm" onClick={saveLoyaltySettings}>Set</Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Porcentaje de la venta total que se convierte en puntos.</p>
            </div>
          </div>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {customers.map(c => (
                <div 
                  key={c.id} 
                  className={`p-4 border rounded-xl cursor-pointer transition-all hover:border-primary ${selectedCustomer?.id === c.id ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => { setSelectedCustomer(c); setCustomerForm(c); setIsEditing(false); }}
                >
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</div>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="secondary">{c.points} pts</Badge>
                    <span className="text-[10px] opacity-50">Visitas: {c.totalVisits}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Perfil o Formulario */}
      <Card className="lg:col-span-2 overflow-hidden bg-zinc-900 text-white">
        {selectedCustomer && !isEditing ? (
          <div className="h-full flex flex-col">
            {/* Header del Perfil - Basado en la captura */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-white" onClick={() => setSelectedCustomer(null)}>
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-xl font-bold">Perfil del cliente</h2>
              </div>
              <Button variant="ghost" className="text-emerald-500 font-bold">AÑADIR AL TICKET</Button>
            </div>

            <div className="flex-1 p-8 space-y-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center">
                  <Users className="h-12 w-12 opacity-30" />
                </div>
                <h3 className="text-2xl font-bold">{selectedCustomer.name}</h3>
              </div>

              <div className="space-y-6 max-w-md mx-auto">
                <div className="flex items-center gap-4">
                  <Mail className="h-5 w-5 opacity-60" />
                  <span className="text-sm">{selectedCustomer.email || 'Sin correo'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="h-5 w-5 opacity-60" />
                  <span className="text-sm">{selectedCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 opacity-60" />
                  <span className="text-sm">{selectedCustomer.city || 'Ciudad no especificada'}</span>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-bold text-lg">{selectedCustomer.points.toFixed(2)}</div>
                      <div className="text-xs opacity-50">Puntos</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <ShoppingBag className="h-5 w-5 text-emerald-500" />
                    <div>
                      <div className="font-bold text-lg">{selectedCustomer.totalVisits}</div>
                      <div className="text-xs opacity-50">Visitas</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-bold text-lg">
                        {selectedCustomer.lastVisit ? new Date(selectedCustomer.lastVisit).toLocaleDateString() : 'Nunca'}
                      </div>
                      <div className="text-xs opacity-50">Última visita</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 space-y-4 max-w-md mx-auto">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-emerald-500 font-bold h-12 hover:bg-white/5"
                  onClick={() => setIsEditing(true)}
                >
                  EDITAR PERFIL
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-emerald-500 font-bold h-12 hover:bg-white/5"
                  onClick={() => toast({ title: "Canje de puntos", description: "Próximamente disponible" })}
                >
                  CANJEAR PUNTOS
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-emerald-500 font-bold h-12 hover:bg-white/5"
                  onClick={() => toast({ title: "Historial", description: "Cargando historial de compras..." })}
                >
                  VER COMPRAS
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{isEditing ? 'Editar Cliente' : 'Nuevo Registro'}</h2>
              {(isEditing || customerForm.name) && (
                <Button variant="ghost" onClick={() => { setIsEditing(false); setCustomerForm(initialCustomer); setSelectedCustomer(null); }}>
                  <X />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-zinc-400">Nombre Completo *</Label>
                <Input 
                  className="bg-zinc-800 border-zinc-700 text-white" 
                  value={customerForm.name} 
                  onChange={e => setCustomerForm({...customerForm, name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">WhatsApp *</Label>
                <Input 
                  className="bg-zinc-800 border-zinc-700 text-white" 
                  value={customerForm.phone} 
                  onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Email</Label>
                <Input 
                  className="bg-zinc-800 border-zinc-700 text-white" 
                  value={customerForm.email} 
                  onChange={e => setCustomerForm({...customerForm, email: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Fecha de Nacimiento</Label>
                <Input 
                  type="date" 
                  className="bg-zinc-800 border-zinc-700 text-white" 
                  value={customerForm.birthday} 
                  onChange={e => setCustomerForm({...customerForm, birthday: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Ciudad</Label>
                <Input 
                  className="bg-zinc-800 border-zinc-700 text-white" 
                  value={customerForm.city} 
                  onChange={e => setCustomerForm({...customerForm, city: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={customerForm.acceptsMarketing} 
                  onCheckedChange={v => setCustomerForm({...customerForm, acceptsMarketing: v})} 
                />
                <Label className="text-sm text-zinc-300 cursor-pointer" onClick={() => setCustomerForm({...customerForm, acceptsMarketing: !customerForm.acceptsMarketing})}>
                  Acepto recibir publicidad o comentarios
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={customerForm.acceptsTerms} 
                  onCheckedChange={v => setCustomerForm({...customerForm, acceptsTerms: v})} 
                />
                <Label className="text-sm text-zinc-300 cursor-pointer" onClick={() => setCustomerForm({...customerForm, acceptsTerms: !customerForm.acceptsTerms})}>
                  Acepto los términos y condiciones del sitio web *
                </Label>
              </div>
            </div>

            <Button 
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg"
              onClick={handleSaveCustomer}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />}
              {isEditing ? 'ACTUALIZAR DATOS' : 'REGISTRAR CLIENTE'}
            </Button>
          </div>
        )}
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
