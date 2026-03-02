
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Order, Payment, OrderItem, ServiceType, Modifier, ModifierOption, Customer, Discount, LoyaltySettings } from '@/lib/types';
import { 
  Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle2, X, ShoppingCart, 
  RefreshCw, ArrowLeft, User, MapPin, Tag, MessageSquare, Save, Wallet, Search, Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, addDoc, query, orderBy, doc, updateDoc, increment, getDoc } from 'firebase/firestore';

const TAX_RATE = 0.08;

export default function PosContainer() {
  const db = useFirestore();
  const router = useRouter();
  
  const menuQuery = useMemo(() => query(collection(db, 'menu'), orderBy('name', 'asc')), [db]);
  const modifiersQuery = useMemo(() => collection(db, 'modifiers'), [db]);
  const customersQuery = useMemo(() => query(collection(db, 'customers'), orderBy('name', 'asc')), [db]);
  const discountsQuery = useMemo(() => collection(db, 'discounts'), [db]);
  const loyaltyDocRef = useMemo(() => doc(db, 'settings', 'loyalty'), [db]);

  const { data: menuItems } = useCollection<MenuItem>(menuQuery);
  const { data: modifiersData } = useCollection<Modifier>(modifiersQuery);
  const { data: customersData } = useCollection<Customer>(customersQuery);
  const { data: discountsData } = useCollection<Discount>(discountsQuery);
  const { data: loyaltySettings } = useDoc<LoyaltySettings>(loyaltyDocRef);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [modifierDialogOpen, setModifierDialogOpen] = useState(false);
  const [selectedItemForMod, setSelectedItemForMod] = useState<MenuItem | null>(null);
  const [tempModifiers, setTempModifiers] = useState<ModifierOption[]>([]);
  const [tempNotes, setTempNotes] = useState('');
  
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Formulario nuevo cliente
  const initialCustomer: Partial<Customer> = {
    name: '',
    phone: '',
    email: '',
    birthday: '',
    acceptsMarketing: false,
    acceptsTerms: false
  };
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>(initialCustomer);

  function createEmptyOrder(): Order {
    return {
      id: `PED-${Math.floor(Math.random() * 90000) + 10000}`,
      status: 'draft',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      discountAmount: 0,
      payments: [],
      paidAmount: 0,
      serviceType: 'mesa',
      tableNumber: '1',
      createdAt: Date.now(),
    };
  }

  useEffect(() => {
    setMounted(true);
    setActiveOrder(createEmptyOrder());
  }, []);

  const openModifierDialog = (item: MenuItem) => {
    if (activeOrder?.status !== 'draft') return;
    setSelectedItemForMod(item);
    setTempModifiers([]);
    setTempNotes('');
    setModifierDialogOpen(true);
  };

  const toggleModifier = (opt: ModifierOption) => {
    setTempModifiers(prev => 
      prev.find(p => p.name === opt.name) 
        ? prev.filter(p => p.name !== opt.name)
        : [...prev, opt]
    );
  };

  const confirmAddToCart = () => {
    if (!selectedItemForMod || !activeOrder) return;

    const newItem: OrderItem = {
      id: `OI-${Date.now()}`,
      menuItemId: selectedItemForMod.id!,
      name: selectedItemForMod.name,
      quantity: 1,
      priceAtOrder: selectedItemForMod.price,
      selectedModifiers: [...tempModifiers],
      notes: tempNotes
    };

    setActiveOrder(prev => {
      if (!prev) return null;
      const newItems = [...prev.items, newItem];
      return updateOrderTotals({ ...prev, items: newItems });
    });

    setModifierDialogOpen(false);
    toast({ title: 'Agregado', description: `${selectedItemForMod.name} con extras.` });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    if (!activeOrder || activeOrder.status !== 'draft') return;
    setActiveOrder(prev => {
      if (!prev) return null;
      const newItems = prev.items.map(i => {
        if (i.id === itemId) {
          return { ...i, quantity: Math.max(0, i.quantity + delta) };
        }
        return i;
      }).filter(i => i.quantity > 0);
      return updateOrderTotals({ ...prev, items: newItems });
    });
  };

  const updateOrderTotals = (order: Order): Order => {
    const subtotal = order.items.reduce((acc, item) => {
      const modsPrice = item.selectedModifiers.reduce((mAcc, m) => mAcc + m.price, 0);
      return acc + ((item.priceAtOrder + modsPrice) * item.quantity);
    }, 0);
    
    const discount = order.discountAmount || 0;
    const tax = (subtotal - discount) * TAX_RATE;
    const total = subtotal - discount + tax;
    
    return { ...order, subtotal, tax, total };
  };

  const handleRegisterCustomer = async () => {
    if (!customerForm.name || !customerForm.phone || !customerForm.acceptsTerms) {
      toast({ variant: 'destructive', title: "Nombre, WhatsApp y Términos son obligatorios" });
      return;
    }
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customerForm,
        points: 0,
        totalVisits: 0,
        lastVisit: 0,
        createdAt: Date.now()
      });
      setActiveOrder(prev => prev ? ({ ...prev, customerId: docRef.id }) : null);
      setCustomerDialogOpen(false);
      setNewCustomerMode(false);
      setCustomerForm(initialCustomer);
      toast({ title: "Cliente Registrado", description: "Venta vinculada al nuevo cliente." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error al registrar cliente" });
    } finally {
      setLoading(false);
    }
  };

  const saveTicketOpen = async () => {
    if (!activeOrder || activeOrder.items.length === 0) return;
    try {
      const orderData = { ...activeOrder, status: 'open', updatedAt: Date.now() };
      if (activeOrder.firestoreId) {
        await updateDoc(doc(db, 'orders', activeOrder.firestoreId), orderData);
      } else {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        setActiveOrder({ ...orderData, firestoreId: docRef.id });
      }
      toast({ title: 'Ticket Guardado', description: 'Pedido en estado abierto.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al guardar' });
    }
  };

  const confirmToKitchen = async () => {
    if (!activeOrder || activeOrder.items.length === 0) return;
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        ...activeOrder,
        status: 'confirmed',
        createdAt: Date.now()
      });

      await addDoc(collection(db, 'tickets'), {
        orderId: activeOrder.id,
        firestoreOrderId: orderRef.id,
        status: 'new',
        items: activeOrder.items.map(i => ({ 
          name: i.name, 
          quantity: i.quantity,
          modifiers: i.selectedModifiers.map(m => m.name),
          notes: i.notes
        })),
        serviceType: activeOrder.serviceType,
        tableNumber: activeOrder.tableNumber,
        timestamp: Date.now()
      });

      setActiveOrder(prev => prev ? ({ ...prev, status: 'confirmed', firestoreId: orderRef.id }) : null);
      toast({ title: 'Enviado a Cocina', description: 'Ticket generado correctamente.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const handlePayment = async (method: 'cash' | 'card' | 'transfer') => {
    if (!activeOrder) return;
    const amountToPay = parseFloat(partialAmount) || (activeOrder.total - activeOrder.paidAmount);
    
    const newPayment: Payment = {
      id: `PAG-${Date.now()}`,
      amount: amountToPay,
      method,
      timestamp: Date.now()
    };

    const newPaidAmount = activeOrder.paidAmount + amountToPay;
    const isFullyPaid = newPaidAmount >= activeOrder.total - 0.01;

    if (isFullyPaid && activeOrder.customerId) {
      const percentage = loyaltySettings?.pointsPercentage || 10;
      const points = (activeOrder.total * (percentage / 100));
      await updateDoc(doc(db, 'customers', activeOrder.customerId), {
        points: increment(points),
        totalVisits: increment(1),
        lastVisit: Date.now()
      });
    }

    setActiveOrder(prev => {
      if (!prev) return null;
      return {
        ...prev,
        payments: [...prev.payments, newPayment],
        paidAmount: newPaidAmount,
        status: isFullyPaid ? 'paid' : prev.status
      };
    });

    setPartialAmount('');
    if (isFullyPaid) {
      setPaymentDialogOpen(false);
      toast({ title: 'Pago Completado' });
    }
  };

  const resetAll = () => {
    setActiveOrder(createEmptyOrder());
    setPaymentDialogOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-6 w-6 text-primary" />
            </Button>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" /> ChoripanFlow POS
            </h1>
          </div>
          <div className="flex gap-4 items-center">
            <Select 
              value={activeOrder?.serviceType} 
              onValueChange={(v: ServiceType) => setActiveOrder(prev => prev ? ({...prev, serviceType: v}) : null)}
            >
              <SelectTrigger className="w-40 h-10 font-semibold">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mesa">🏠 Mesa</SelectItem>
                <SelectItem value="llevar">🥡 Para Llevar</SelectItem>
                <SelectItem value="domicilio">🛵 Domicilio</SelectItem>
                <SelectItem value="rappi">🟠 Rappi</SelectItem>
                <SelectItem value="ubereats">🟢 UberEats</SelectItem>
                <SelectItem value="didifood">🔴 DidiFood</SelectItem>
              </SelectContent>
            </Select>
            {activeOrder?.serviceType === 'mesa' && (
              <Input 
                className="w-20 text-center font-bold" 
                placeholder="Mesa" 
                value={activeOrder.tableNumber} 
                onChange={e => setActiveOrder(prev => prev ? ({...prev, tableNumber: e.target.value}) : null)}
              />
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {menuItems.map((item) => (
              <Card 
                key={item.id} 
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent active:border-primary overflow-hidden group"
                onClick={() => openModifierDialog(item)}
              >
                <div className="relative h-32 w-full bg-muted">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20"><ShoppingCart /></div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary/90 text-white font-bold border-none shadow-md">${item.price.toFixed(2)}</Badge>
                  </div>
                </div>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm truncate font-bold">{item.name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="grid grid-cols-4 gap-4 bg-white p-4 rounded-xl border shadow-md">
          <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => { setCustomerDialogOpen(true); setNewCustomerMode(false); }}>
            <User className="h-5 w-5" />
            <span className="text-[10px] uppercase font-bold">Cliente</span>
          </Button>
          <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => toast({ title: "Próximamente", description: "Módulo de descuentos manuales" })}>
            <Tag className="h-5 w-5" />
            <span className="text-[10px] uppercase font-bold">Descuentos</span>
          </Button>
          <Button variant="outline" className="h-16 flex-col gap-1" onClick={saveTicketOpen}>
            <Save className="h-5 w-5" />
            <span className="text-[10px] uppercase font-bold">Ticket Abierto</span>
          </Button>
          <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => toast({ title: "Próximamente", description: "Módulo de División de Cuenta" })}>
            <RefreshCw className="h-5 w-5" />
            <span className="text-[10px] uppercase font-bold">Dividir</span>
          </Button>
        </div>
      </div>

      <div className="w-96 bg-white border-l shadow-2xl flex flex-col">
        <div className="p-6 border-b bg-muted/30">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-black text-xl text-primary">{activeOrder?.id}</h2>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="uppercase">{activeOrder?.serviceType}</Badge>
                {activeOrder?.tableNumber && <Badge variant="secondary">MESA {activeOrder.tableNumber}</Badge>}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={resetAll}><X className="h-5 w-5" /></Button>
          </div>
          {activeOrder?.customerId && (
            <div className="mt-4 p-2 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold">{customersData.find(c => c.id === activeOrder.customerId)?.name}</span>
              </div>
              <Badge className="bg-primary text-[10px]">{customersData.find(c => c.id === activeOrder.customerId)?.points.toFixed(0)} pts</Badge>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 p-4">
          {!activeOrder || activeOrder.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 pt-20">
              <ShoppingCart className="h-20 w-20 mb-4" />
              <p className="font-bold">CARRITO VACÍO</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrder.items.map((item) => (
                <div key={item.id} className="border-b pb-4 last:border-0 group">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedModifiers.map((m, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[9px] px-1 py-0">+ {m.name}</Badge>
                        ))}
                      </div>
                      {item.notes && <p className="text-[10px] italic text-muted-foreground mt-1 flex items-center gap-1"><MessageSquare className="h-2 w-2" /> {item.notes}</p>}
                    </div>
                    <div className="text-right ml-4">
                      <span className="font-bold text-sm">
                        ${((item.priceAtOrder + item.selectedModifiers.reduce((a, b) => a + b.price, 0)) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)} disabled={activeOrder.status !== 'draft'}>
                        {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                      </Button>
                      <span className="w-5 text-center text-xs font-black">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)} disabled={activeOrder.status !== 'draft'}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">Unit: ${item.priceAtOrder.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-6 bg-muted/40 space-y-3 border-t shadow-inner">
          <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span>Subtotal</span>
            <span>${activeOrder?.subtotal.toFixed(2)}</span>
          </div>
          {activeOrder && activeOrder.discountAmount > 0 && (
            <div className="flex justify-between text-xs font-bold text-accent uppercase tracking-widest">
              <span>Descuento</span>
              <span>-${activeOrder.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-black text-foreground pt-2 border-t-2 border-primary/20">
            <span>TOTAL</span>
            <span className="text-primary">${activeOrder?.total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-4">
            {activeOrder?.status === 'draft' ? (
              <Button size="lg" className="w-full h-16 text-xl font-black shadow-xl" onClick={confirmToKitchen}>
                ENVIAR A COCINA
              </Button>
            ) : activeOrder?.status === 'confirmed' || activeOrder?.status === 'open' ? (
              <Button size="lg" variant="default" className="w-full h-16 text-xl font-black bg-accent hover:bg-accent/90 shadow-xl" onClick={() => setPaymentDialogOpen(true)}>
                COBRAR PAGO
              </Button>
            ) : (
              <Button size="lg" variant="outline" className="w-full h-16 text-xl font-black" onClick={resetAll}>
                SIGUIENTE CLIENTE
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={modifierDialogOpen} onOpenChange={setModifierDialogOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
          <div className="bg-primary p-6 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{selectedItemForMod?.name}</DialogTitle>
            <DialogDescription className="text-white/70">Personaliza tu plato con ingredientes extra</DialogDescription>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-black text-sm uppercase text-muted-foreground tracking-widest">Toppings & Extras</h3>
              <div className="grid grid-cols-2 gap-3">
                {modifiersData.map(m => m.options.map((opt, idx) => (
                  <Button 
                    key={`${m.id}-${idx}`} 
                    variant={tempModifiers.find(tm => tm.name === opt.name) ? 'default' : 'outline'}
                    className="h-14 justify-between font-bold"
                    onClick={() => toggleModifier(opt)}
                  >
                    <span>{opt.name}</span>
                    <Badge variant="secondary" className="ml-2">+${opt.price.toFixed(2)}</Badge>
                  </Button>
                )))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-muted-foreground">Instrucciones de Cocina</Label>
              <Input 
                placeholder="Ej: Sin cebolla, término medio..." 
                value={tempNotes} 
                onChange={e => setTempNotes(e.target.value)}
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/50">
            <Button variant="ghost" onClick={() => setModifierDialogOpen(false)}>Cancelar</Button>
            <Button className="h-12 px-10 font-black text-lg" onClick={confirmAddToCart}>AGREGAR AL CARRITO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{newCustomerMode ? 'Nuevo Registro de Cliente' : 'Buscador de Clientes'}</DialogTitle>
          </DialogHeader>
          
          {!newCustomerMode ? (
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nombre o teléfono..." className="pl-10" />
              </div>
              <ScrollArea className="h-64 border rounded-md p-2">
                {customersData.map(c => (
                  <div 
                    key={c.id} 
                    className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted cursor-pointer rounded-lg"
                    onClick={() => {
                      setActiveOrder(prev => prev ? ({...prev, customerId: c.id}) : null);
                      setCustomerDialogOpen(false);
                    }}
                  >
                    <div>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">WhatsApp: {c.phone}</div>
                    </div>
                    <Badge variant="secondary">{c.points.toFixed(0)} pts</Badge>
                  </div>
                ))}
              </ScrollArea>
              <Button variant="outline" className="w-full border-dashed" onClick={() => setNewCustomerMode(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nuevo Cliente
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre Completo *</Label>
                <Input value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp (Teléfono) *</Label>
                <Input value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Cumpleaños</Label>
                <Input type="date" value={customerForm.birthday} onChange={e => setCustomerForm({...customerForm, birthday: e.target.value})} />
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch checked={customerForm.acceptsMarketing} onCheckedChange={v => setCustomerForm({...customerForm, acceptsMarketing: v})} />
                  <Label className="text-xs cursor-pointer" onClick={() => setCustomerForm({...customerForm, acceptsMarketing: !customerForm.acceptsMarketing})}>Acepto recibir publicidad o comentarios</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={customerForm.acceptsTerms} onCheckedChange={v => setCustomerForm({...customerForm, acceptsTerms: v})} />
                  <Label className="text-xs cursor-pointer font-bold" onClick={() => setCustomerForm({...customerForm, acceptsTerms: !customerForm.acceptsTerms})}>Acepto los términos y condiciones *</Label>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="ghost" className="flex-1" onClick={() => setNewCustomerMode(false)}>Volver</Button>
                <Button className="flex-1 font-bold" onClick={handleRegisterCustomer} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'REGISTRAR'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Finalizar Venta</DialogTitle>
            <DialogDescription>
              Pendiente: <span className="text-primary font-bold">${(activeOrder ? activeOrder.total - activeOrder.paidAmount : 0).toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="flex flex-col h-24 gap-2 border-2 hover:border-primary hover:bg-primary/5" onClick={() => handlePayment('cash')}>
                <Banknote className="h-8 w-8 text-green-600" />
                <span className="font-bold uppercase text-xs">Efectivo</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-24 gap-2 border-2 hover:border-primary hover:bg-primary/5" onClick={() => handlePayment('card')}>
                <CreditCard className="h-8 w-8 text-blue-600" />
                <span className="font-bold uppercase text-xs">Tarjeta</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-24 gap-2 border-2 hover:border-primary hover:bg-primary/5" onClick={() => handlePayment('transfer')}>
                <Wallet className="h-8 w-8 text-purple-600" />
                <span className="font-bold uppercase text-xs">Transferencia</span>
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Pago Parcial</Label>
              <Input 
                placeholder="Introducir monto..." 
                type="number" 
                value={partialAmount} 
                onChange={(e) => setPartialAmount(e.target.value)}
                className="text-2xl h-14 font-black"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPaymentDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
