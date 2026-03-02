
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Order, OrderItem, UserProfile, Category, ServiceType, DiscountType } from '@/lib/types';
import { 
  Plus, Minus, Trash2, CreditCard, Banknote, X, ShoppingBag, 
  ArrowLeft, User, MessageSquare, Wallet, Search, Loader2, 
  KeyRound, LogOut, Tag, Receipt, ChevronRight, Hash, Percent, Split
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useTenant, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

const CARD_COMMISSION_RATE = 0.0406;

export default function PosContainer() {
  const db = useFirestore();
  const router = useRouter();
  const { orgId, locId } = useTenant();
  const { toast } = useToast();
  
  const menuQuery = useMemoFirebase(() => orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'menuItems'), orderBy('name', 'asc')) : null, [db, orgId, locId]);
  const catsQuery = useMemoFirebase(() => orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'categories'), orderBy('name', 'asc')) : null, [db, orgId, locId]);
  const staffQuery = useMemoFirebase(() => orgId ? collection(db, 'orgs', orgId, 'users') : null, [db, orgId]);
  const locRef = useMemoFirebase(() => orgId && locId ? doc(db, 'orgs', orgId, 'locations', locId) : null, [db, orgId, locId]);
  
  const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>(menuQuery);
  const { data: categories } = useCollection<Category>(catsQuery);
  const { data: staffList } = useCollection<UserProfile>(staffQuery);
  const { data: locationData } = useDoc<any>(locRef);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeStaff, setActiveStaff] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [modifyingItem, setModifyingItem] = useState<{item: OrderItem, index: number} | null>(null);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState('0');
  const [discountType, setDiscountType] = useState<DiscountType>('porcentaje');

  useEffect(() => {
    if (orgId && locId) setActiveOrder(createEmptyOrder());
  }, [orgId, locId, activeStaff]);

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
      locId: locId || '',
      staffId: activeStaff?.uid
    };
  }

  const handlePinSubmit = async () => {
    const found = staffList?.find(s => s.pin === pinInput);
    if (found) {
      setActiveStaff(found);
      setIsLocked(false);
      setPinInput('');
      toast({ title: `Bienvenido, ${found.name}` });
    } else {
      toast({ variant: 'destructive', title: "PIN Incorrecto" });
      setPinInput('');
    }
  };

  const filteredItems = useMemo(() => {
    let items = menuItems || [];
    if (selectedCat !== 'all') items = items.filter(i => i.category === selectedCat);
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [menuItems, selectedCat, search]);

  const updateOrderTotals = (items: OrderItem[], discount: number = activeOrder?.discountAmount || 0, dType: DiscountType = discountType) => {
    const subtotal = items.reduce((acc, i) => acc + (i.priceAtOrder * i.quantity), 0);
    let finalDiscount = discount;
    if (dType === 'porcentaje') finalDiscount = subtotal * (discount / 100);
    
    const taxableSubtotal = subtotal - finalDiscount;
    const taxRate = (locationData?.taxRate || 0) / 100;
    const tax = taxableSubtotal * taxRate;
    const total = taxableSubtotal + tax;

    setActiveOrder(prev => prev ? ({ ...prev, items, subtotal, tax, total, discountAmount: discount, discountType: dType }) : null);
  };

  const addItemToOrder = (menuItem: MenuItem) => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      menuItemId: menuItem.id!,
      name: menuItem.name,
      quantity: 1,
      priceAtOrder: menuItem.price,
      selectedModifiers: []
    };
    const newItems = [...(activeOrder?.items || []), newItem];
    updateOrderTotals(newItems);
  };

  const applyDiscount = () => {
    updateOrderTotals(activeOrder?.items || [], Number(discountValue), discountType);
    setIsDiscountOpen(false);
  };

  const completeOrder = async (method: 'cash' | 'card') => {
    if (!activeOrder || activeOrder.items.length === 0) return;
    try {
      const orderData = {
        ...activeOrder,
        status: 'confirmed',
        payments: [{ id: Date.now().toString(), amount: activeOrder.total, method, timestamp: Date.now() }],
        paidAmount: activeOrder.total,
        updatedAt: serverTimestamp()
      };
      
      // Registrar Pedido en Firestore
      await addDoc(collection(db, 'orgs', orgId!, 'locations', locId!, 'orders'), orderData);
      
      // Enviar a Cocina
      await addDoc(collection(db, 'orgs', orgId!, 'locations', locId!, 'kitchenTickets'), {
        orderId: activeOrder.id,
        status: 'new',
        items: activeOrder.items.map(i => ({ name: i.name, quantity: i.quantity, modifiers: i.selectedModifiers, notes: i.notes })),
        timestamp: Date.now(),
        serviceType: activeOrder.serviceType,
        tableNumber: activeOrder.tableNumber,
        locId
      });

      toast({ title: "Venta Completada", description: `Ticket ${activeOrder.id} enviado a cocina.` });
      setActiveOrder(createEmptyOrder());
    } catch (e) { toast({ variant: 'destructive', title: "Error al procesar" }); }
  };

  if (isLocked) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
        <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto border-2 border-primary/40">
              <KeyRound className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Terminal POS</h1>
              <p className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase mt-2">PIN DE EMPLEADO</p>
            </div>
            <div className="flex justify-center gap-3 text-4xl font-black tracking-widest text-primary h-12">
              {pinInput.padEnd(4, '•').split('').map((char, i) => (
                <div key={i} className="w-12 border-b-4 border-zinc-700 pb-2">{char}</div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((val) => (
                <Button 
                  key={val} 
                  variant="outline" 
                  className="h-16 text-2xl font-black rounded-2xl border-white/5 bg-zinc-800/50 hover:bg-primary hover:text-white transition-all active:scale-90"
                  onClick={() => {
                    if (val === 'C') setPinInput('');
                    else if (val === 'OK') handlePinSubmit();
                    else if (pinInput.length < 4) setPinInput(prev => prev + val);
                  }}
                >
                  {val}
                </Button>
              ))}
            </div>
            <Button variant="ghost" className="text-zinc-500 mt-4 font-bold uppercase text-[10px] tracking-widest" onClick={() => router.push('/')}>Volver al Inicio</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden">
      {/* Sidebar de Productos */}
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        <div className="flex gap-4 items-center">
           <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input placeholder="Buscar por nombre o referencia..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-14 bg-white border-2 rounded-2xl shadow-sm font-bold text-lg" />
           </div>
           <Button variant="outline" className="h-14 w-14 rounded-2xl border-2 bg-white" onClick={() => router.push('/')}><ArrowLeft /></Button>
        </div>

        <div className="flex gap-2 pb-2 overflow-x-auto custom-scrollbar no-scrollbar">
           <Button variant={selectedCat === 'all' ? 'default' : 'outline'} className="rounded-xl h-10 px-6 font-black uppercase italic tracking-tighter shrink-0" onClick={() => setSelectedCat('all')}>TODOS</Button>
           {categories?.map(cat => (
             <Button key={cat.id} variant={selectedCat === cat.name ? 'default' : 'outline'} className="rounded-xl h-10 px-6 font-black uppercase italic tracking-tighter shrink-0" onClick={() => setSelectedCat(cat.name)}>{cat.name}</Button>
           ))}
        </div>

        <ScrollArea className="flex-1">
          {menuLoading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="cursor-pointer active:scale-95 transition-all overflow-hidden border-2 hover:border-primary group rounded-[1.5rem] shadow-sm bg-white" onClick={() => addItemToOrder(item)}>
                  <div className="h-32 bg-muted relative">
                    {item.image ? (
                       <img src={item.image} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center opacity-10" style={{backgroundColor: item.tpvColor}}><ShoppingBag className="h-10 w-10" /></div>
                    )}
                    <div className="absolute top-2 right-2"><Badge className="font-black bg-white text-primary border-2 px-3 py-1 shadow-lg text-lg">${item.price}</Badge></div>
                  </div>
                  <div className="p-4 flex flex-col items-center text-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase mb-1">{item.category}</span>
                    <div className="font-black text-xs md:text-sm uppercase italic tracking-tighter leading-tight line-clamp-2 h-10">{item.name}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Ticket Panel */}
      <div className="w-[420px] bg-white border-l-2 shadow-2xl flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-muted/20">
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Operador: {activeStaff?.name}</p>
            <h2 className="font-black text-2xl text-primary italic tracking-tighter">{activeOrder?.id}</h2>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10" onClick={() => setActiveOrder(createEmptyOrder())}><X className="text-destructive h-6 w-6" /></Button>
        </div>

        <ScrollArea className="flex-1 p-6">
           <div className="space-y-4">
              {activeOrder?.items.map((item, idx) => (
                <div key={item.id} className="group flex flex-col gap-1 border-b-2 border-dashed pb-4 mb-2">
                   <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                         <div className="flex flex-col items-center bg-primary/10 rounded-lg p-1 min-w-[32px] h-fit">
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/20" onClick={() => {
                               const newItems = [...activeOrder.items];
                               newItems[idx].quantity += 1;
                               updateOrderTotals(newItems);
                            }}><Plus className="h-3 w-3" /></Button>
                            <span className="font-black text-lg leading-none py-1">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/20" onClick={() => {
                               const newItems = [...activeOrder.items];
                               if (newItems[idx].quantity > 1) newItems[idx].quantity -= 1;
                               else newItems.splice(idx, 1);
                               updateOrderTotals(newItems);
                            }}><Minus className="h-3 w-3" /></Button>
                         </div>
                         <div>
                            <h4 className="font-black text-sm uppercase italic leading-tight">{item.name}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                               {item.selectedModifiers.map((m, mIdx) => <Badge key={mIdx} variant="secondary" className="text-[8px] px-1 font-bold">{m}</Badge>)}
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="font-black text-primary">${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                         <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-muted" onClick={() => {
                               const menuItem = menuItems?.find(mi => mi.id === item.menuItemId);
                               if (menuItem) setModifyingItem({ item, index: idx });
                            }}><MessageSquare className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-destructive/10 text-destructive" onClick={() => {
                               const newItems = [...activeOrder.items];
                               newItems.splice(idx, 1);
                               updateOrderTotals(newItems);
                            }}><Trash2 className="h-3 w-3" /></Button>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
           {(!activeOrder || activeOrder.items.length === 0) && (
             <div className="flex h-full flex-col items-center justify-center text-muted-foreground opacity-20 mt-20">
               <ShoppingBag className="h-24 w-24 mb-4" />
               <p className="font-black uppercase tracking-widest text-sm">Esperando Pedido...</p>
             </div>
           )}
        </ScrollArea>

        <div className="p-8 bg-[#F8F9FA] space-y-4 border-t-4 border-t-primary shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
           <div className="space-y-2">
             <div className="flex justify-between text-xs font-black text-muted-foreground uppercase"><span>Subtotal</span><span>${activeOrder?.subtotal.toFixed(2)}</span></div>
             {activeOrder && activeOrder.discountAmount > 0 && (
               <div className="flex justify-between text-xs font-black text-destructive uppercase">
                  <span>Descuento ({activeOrder.discountType === 'porcentaje' ? `${activeOrder.discountAmount}%` : `$${activeOrder.discountAmount}`})</span>
                  <span>-${(activeOrder.subtotal - (activeOrder.total / (1 + (locationData?.taxRate || 0)/100))).toFixed(2)}</span>
               </div>
             )}
             <div className="flex justify-between text-xs font-black text-muted-foreground uppercase"><span>IVA ({locationData?.taxRate || 0}%)</span><span>${activeOrder?.tax.toFixed(2)}</span></div>
           </div>
           
           <div className="flex justify-between items-center py-2">
              <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
                 <DialogTrigger asChild><Button variant="outline" size="sm" className="h-10 rounded-xl font-black gap-2 border-2"><Tag className="h-4 w-4" /> DESCUENTO</Button></DialogTrigger>
                 <DialogContent className="rounded-[2rem] p-8">
                    <DialogHeader><DialogTitle className="font-black uppercase italic text-2xl">Aplicar Descuento</DialogTitle></DialogHeader>
                    <div className="space-y-6 pt-4">
                       <div className="grid grid-cols-2 gap-4">
                          <Button variant={discountType === 'porcentaje' ? 'primary' : 'outline'} className="h-14 font-black rounded-xl" onClick={() => setDiscountType('porcentaje')}><Percent className="mr-2 h-4 w-4" /> PORCENTAJE</Button>
                          <Button variant={discountType === 'monto' ? 'primary' : 'outline'} className="h-14 font-black rounded-xl" onClick={() => setDiscountType('monto')}><Hash className="mr-2 h-4 w-4" /> MONTO FIJO</Button>
                       </div>
                       <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="h-16 text-3xl font-black text-center rounded-2xl" placeholder="0" />
                       <Button className="w-full h-16 font-black text-xl rounded-2xl" onClick={applyDiscount}>CONFIRMAR DESCUENTO</Button>
                    </div>
                 </DialogContent>
              </Dialog>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-muted-foreground">Total a Pagar</p>
                 <h3 className="text-5xl font-black italic tracking-tighter text-primary leading-none">${activeOrder?.total.toFixed(2)}</h3>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3 pt-2">
              <Button className="h-16 font-black uppercase italic tracking-tighter text-lg bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100 rounded-2xl border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all" onClick={() => completeOrder('cash')}>
                <Banknote className="mr-2 h-6 w-6" /> EFECTIVO
              </Button>
              <Button className="h-16 font-black uppercase italic tracking-tighter text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 rounded-2xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all" onClick={() => completeOrder('card')}>
                <CreditCard className="mr-2 h-6 w-6" /> TARJETA
              </Button>
           </div>
        </div>
      </div>

      {/* Dialog de Modificadores */}
      <Dialog open={!!modifyingItem} onOpenChange={() => setModifyingItem(null)}>
         <DialogContent className="rounded-[2.5rem] p-10 max-w-md">
            <DialogHeader>
               <DialogTitle className="font-black text-3xl uppercase italic text-primary">Modificadores</DialogTitle>
               <DialogDescription className="font-bold text-xs uppercase tracking-widest">{modifyingItem?.item.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-6">
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase ml-1">Opciones Disponibles</Label>
                  <div className="flex flex-wrap gap-2">
                     {menuItems?.find(mi => mi.id === modifyingItem?.item.menuItemId)?.modifiers?.map((mod, i) => (
                       <Button key={i} variant={modifyingItem?.item.selectedModifiers.includes(mod) ? 'default' : 'outline'} className="rounded-xl font-bold h-10" onClick={() => {
                          const newItems = [...(activeOrder?.items || [])];
                          const currentMods = [...newItems[modifyingItem!.index].selectedModifiers];
                          if (currentMods.includes(mod)) newItems[modifyingItem!.index].selectedModifiers = currentMods.filter(m => m !== mod);
                          else newItems[modifyingItem!.index].selectedModifiers = [...currentMods, mod];
                          updateOrderTotals(newItems);
                       }}>{mod}</Button>
                     ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Notas Especiales</Label>
                  <Input placeholder="Ej: Sin sal, término medio..." value={modifyingItem?.item.notes || ''} onChange={e => {
                     const newItems = [...(activeOrder?.items || [])];
                     newItems[modifyingItem!.index].notes = e.target.value;
                     updateOrderTotals(newItems);
                  }} className="h-12 rounded-xl bg-muted/50 border-0" />
               </div>
               <Button className="w-full h-14 font-black rounded-xl" onClick={() => setModifyingItem(null)}>LISTO</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
