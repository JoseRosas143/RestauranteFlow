"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Order, Payment, OrderItem, ServiceType, Modifier, ModifierOption, Customer, LoyaltySettings } from '@/lib/types';
import { 
  Plus, Minus, Trash2, CreditCard, Banknote, X, ShoppingBag, 
  RefreshCw, ArrowLeft, User, MessageSquare, Save, Wallet, Search, Loader2 
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
import { useFirestore, useCollection, useDoc, useTenant, useMemoFirebase } from '@/firebase';
import { collection, doc, runTransaction, query, orderBy, setDoc, increment, addDoc } from 'firebase/firestore';
import LocationSelector from '@/components/tenant/LocationSelector';

const TAX_RATE = 0.08;
const CARD_COMMISSION_RATE = 0.0406; // 4.06%

export default function PosContainer() {
  const db = useFirestore();
  const router = useRouter();
  const { orgId, locId } = useTenant();
  
  const menuPath = useMemoFirebase(() => orgId && locId ? collection(db, 'orgs', orgId, 'locations', locId, 'menuItems') : null, [db, orgId, locId]);
  const modifiersPath = useMemoFirebase(() => orgId && locId ? collection(db, 'orgs', orgId, 'locations', locId, 'modifiers') : null, [db, orgId, locId]);
  const customersPath = useMemoFirebase(() => orgId ? query(collection(db, 'orgs', orgId, 'customers'), orderBy('name', 'asc')) : null, [db, orgId]);
  const loyaltyDocRef = useMemo(() => orgId ? doc(db, 'orgs', orgId, 'settings', 'loyalty') : null, [db, orgId]);

  const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>(menuPath ? query(menuPath, orderBy('name', 'asc')) : null);
  const { data: modifiersData } = useCollection<Modifier>(modifiersPath);
  const { data: customersData } = useCollection<Customer>(customersPath);
  const { data: loyaltySettings } = useDoc<LoyaltySettings>(loyaltyDocRef);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [mounted, setMounted] = useState(false);
  const [modifierDialogOpen, setModifierDialogOpen] = useState(false);
  const [selectedItemForMod, setSelectedItemForMod] = useState<MenuItem | null>(null);
  const [tempModifiers, setTempModifiers] = useState<ModifierOption[]>([]);
  const [tempNotes, setTempNotes] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (orgId && locId) setActiveOrder(createEmptyOrder());
  }, [orgId, locId]);

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
      orgId: orgId || '',
      locId: locId || ''
    };
  }

  const openModifierDialog = (item: MenuItem) => {
    if (activeOrder?.status !== 'draft') return;
    setSelectedItemForMod(item);
    setTempModifiers([]);
    setTempNotes('');
    setModifierDialogOpen(true);
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
    setActiveOrder(prev => prev ? updateOrderTotals({ ...prev, items: [...prev.items, newItem] }) : null);
    setModifierDialogOpen(false);
  };

  const updateOrderTotals = (order: Order): Order => {
    const subtotal = order.items.reduce((acc, item) => {
      const modsPrice = item.selectedModifiers.reduce((mAcc, m) => mAcc + m.price, 0);
      return acc + ((item.priceAtOrder + modsPrice) * item.quantity);
    }, 0);
    const tax = (subtotal - order.discountAmount) * TAX_RATE;
    return { ...order, subtotal, tax, total: subtotal - order.discountAmount + tax };
  };

  const confirmToKitchen = async () => {
    if (!activeOrder || activeOrder.items.length === 0 || !orgId || !locId) return;
    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(collection(db, 'orgs', orgId, 'locations', locId, 'orders'));
        const ticketRef = doc(collection(db, 'orgs', orgId, 'locations', locId, 'kitchenTickets'));
        
        transaction.set(orderRef, { ...activeOrder, status: 'confirmed', updatedAt: Date.now() });
        transaction.set(ticketRef, {
          orderId: activeOrder.id,
          firestoreOrderId: orderRef.id,
          status: 'new',
          items: activeOrder.items.map(i => ({ 
            name: i.name, quantity: i.quantity, modifiers: i.selectedModifiers.map(m => m.name), notes: i.notes 
          })),
          serviceType: activeOrder.serviceType,
          tableNumber: activeOrder.tableNumber,
          timestamp: Date.now(),
          locId: locId
        });
      });
      setActiveOrder(prev => prev ? ({ ...prev, status: 'confirmed' }) : null);
      toast({ title: 'Enviado a Cocina' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error en transacción' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (method: 'cash' | 'card' | 'transfer') => {
    if (!activeOrder || !orgId || !locId) return;
    const amountToPay = parseFloat(partialAmount) || (activeOrder.total - activeOrder.paidAmount);
    
    // Cálculo de comisión de tarjeta: monto - (monto * 4.06%)
    const netAmount = method === 'card' 
      ? amountToPay * (1 - CARD_COMMISSION_RATE) 
      : amountToPay;

    const newPaidAmount = activeOrder.paidAmount + amountToPay;
    const isFullyPaid = newPaidAmount >= activeOrder.total - 0.01;
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        if (isFullyPaid && activeOrder.customerId) {
          const custRef = doc(db, 'orgs', orgId, 'customers', activeOrder.customerId);
          const pts = activeOrder.total * ((loyaltySettings?.pointsPercentage || 10) / 100);
          transaction.update(custRef, { points: increment(pts), totalVisits: increment(1), lastVisit: Date.now() });
        }

        const analyticsRef = doc(db, 'orgs', orgId, 'locations', locId, 'analytics', 'daily', 'days', today);
        const analyticsSnap = await transaction.get(analyticsRef);
        
        const data = analyticsSnap.exists() ? analyticsSnap.data() : { totalRevenue: 0, netRevenue: 0, totalOrders: 0, items: {} };
        const updatedItems = { ...data.items };
        
        if (isFullyPaid) {
          activeOrder.items.forEach(item => {
            const current = updatedItems[item.menuItemId] || { quantity: 0, revenue: 0 };
            updatedItems[item.menuItemId] = {
              quantity: current.quantity + item.quantity,
              revenue: current.revenue + (item.priceAtOrder * item.quantity)
            };
          });
          transaction.set(analyticsRef, {
            totalRevenue: increment(activeOrder.total),
            netRevenue: increment(netAmount),
            totalOrders: increment(1),
            items: updatedItems
          }, { merge: true });
        }
      });

      setActiveOrder(prev => {
        if (!prev) return null;
        return {
          ...prev,
          payments: [...prev.payments, { 
            id: `PAG-${Date.now()}`, 
            amount: amountToPay, 
            netAmount, 
            method, 
            timestamp: Date.now() 
          }],
          paidAmount: newPaidAmount,
          status: isFullyPaid ? 'paid' : prev.status
        };
      });
      setPartialAmount('');
      if (isFullyPaid) {
        setPaymentDialogOpen(false);
        toast({ title: 'Venta Finalizada', description: method === 'card' ? `Neto recibido: $${netAmount.toFixed(2)}` : '' });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error en pago' });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <LocationSelector />
      
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}><ArrowLeft className="h-6 w-6 text-primary" /></Button>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" /> RestauranteFlow POS
            </h1>
          </div>
          <div className="flex gap-4 items-center">
            <Select value={activeOrder?.serviceType} onValueChange={(v: ServiceType) => setActiveOrder(prev => prev ? ({...prev, serviceType: v}) : null)}>
              <SelectTrigger className="w-40 h-10 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mesa">🏠 Mesa</SelectItem>
                <SelectItem value="llevar">🥡 Para Llevar</SelectItem>
                <SelectItem value="domicilio">🛵 Domicilio</SelectItem>
                <SelectItem value="rappi">🟠 Rappi</SelectItem>
                <SelectItem value="ubereats">🟢 UberEats</SelectItem>
                <SelectItem value="didifood">🔴 DidiFood</SelectItem>
              </SelectContent>
            </Select>
            {activeOrder?.serviceType === 'mesa' && <Input className="w-20 text-center font-bold" value={activeOrder.tableNumber} onChange={e => setActiveOrder(prev => prev ? ({...prev, tableNumber: e.target.value}) : null)} />}
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          {!locId ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <Search className="h-20 w-20 mb-4" />
              <h2 className="text-2xl font-bold italic">Seleccione una sucursal para comenzar</h2>
            </div>
          ) : menuLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
              {menuItems?.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent active:border-primary overflow-hidden group" onClick={() => openModifierDialog(item)}>
                  <div className="relative h-32 w-full bg-muted">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><ShoppingBag /></div>}
                    <div className="absolute top-2 right-2"><Badge className="bg-primary/90 text-white font-bold">${item.price.toFixed(2)}</Badge></div>
                  </div>
                  <CardHeader className="p-3"><CardTitle className="text-sm truncate font-bold">{item.name}</CardTitle></CardHeader>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="w-96 bg-white border-l shadow-2xl flex flex-col">
        <div className="p-6 border-b bg-muted/30">
          <div className="flex justify-between items-start">
            <div><h2 className="font-black text-xl text-primary">{activeOrder?.id}</h2><div className="flex gap-2 mt-1"><Badge variant="outline" className="uppercase">{activeOrder?.serviceType}</Badge></div></div>
            <Button variant="ghost" size="icon" onClick={() => setActiveOrder(createEmptyOrder())}><X className="h-5 w-5" /></Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {activeOrder?.items.map((item) => (
            <div key={item.id} className="border-b pb-4 last:border-0 mb-4">
              <div className="flex justify-between font-bold text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.selectedModifiers.map((m, idx) => <Badge key={idx} variant="secondary" className="text-[9px]">+ {m.name}</Badge>)}
              </div>
            </div>
          ))}
        </ScrollArea>

        <div className="p-6 bg-muted/40 space-y-3 border-t">
          <div className="flex justify-between text-2xl font-black"><span>TOTAL</span><span className="text-primary">${activeOrder?.total.toFixed(2)}</span></div>
          <Button size="lg" className="w-full h-16 text-xl font-black" onClick={activeOrder?.status === 'draft' ? confirmToKitchen : () => setPaymentDialogOpen(true)} disabled={loading || !locId}>
            {loading ? <Loader2 className="animate-spin" /> : (activeOrder?.status === 'draft' ? 'ENVIAR A COCINA' : 'COBRAR')}
          </Button>
        </div>
      </div>

      <Dialog open={modifierDialogOpen} onOpenChange={setModifierDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogTitle className="text-2xl font-black">{selectedItemForMod?.name}</DialogTitle>
          <div className="p-4 space-y-4">
             {modifiersData?.map(m => (
               <div key={m.id} className="space-y-2">
                 <Label className="font-bold">{m.name}</Label>
                 <div className="flex flex-wrap gap-2">
                   {m.options.map((opt, i) => (
                     <Button key={i} variant={tempModifiers.some(tm => tm.name === opt.name) ? 'default' : 'outline'} onClick={() => {
                        setTempModifiers(prev => prev.some(p => p.name === opt.name) ? prev.filter(p => p.name !== opt.name) : [...prev, opt]);
                     }}>{opt.name} (+${opt.price})</Button>
                   ))}
                 </div>
               </div>
             ))}
          </div>
          <DialogFooter><Button onClick={confirmAddToCart}>Agregar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase">Finalizar Venta</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="h-24 flex-col" onClick={() => handlePayment('cash')}><Banknote className="h-8 w-8 text-green-600" />Efectivo</Button>
              <Button variant="outline" className="h-24 flex-col" onClick={() => handlePayment('card')}>
                <CreditCard className="h-8 w-8 text-blue-600" />
                Tarjeta
                <span className="text-[10px] opacity-50">-4.06% Com.</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col" onClick={() => handlePayment('transfer')}><Wallet className="h-8 w-8 text-purple-600" />Transf.</Button>
            </div>
            <Input type="number" placeholder="Monto parcial..." value={partialAmount} onChange={e => setPartialAmount(e.target.value)} className="text-2xl h-14 font-black" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}