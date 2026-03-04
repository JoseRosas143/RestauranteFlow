
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Order, OrderItem, UserProfile, Category, ServiceType, DiscountType, ModifierGroup, Discount } from '@/lib/types';
import { 
  Plus, Minus, Trash2, CreditCard, Banknote, X, ShoppingBag, 
  ArrowLeft, User, MessageSquare, Wallet, Search, Loader2, 
  KeyRound, LogOut, Tag, Receipt, ChevronRight, Hash, Percent, Split, 
  Menu, Save, Utensils, Clock, Users, Gift, MoreHorizontal, ArrowRightLeft, Eraser, Trash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useTenant, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, orderBy, addDoc, serverTimestamp, updateDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LocationSelector from '@/components/tenant/LocationSelector';

const SERVICE_OPTIONS = [
  "Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5",
  "Llevar 1", "Llevar 2",
  "Rappi", "UberEats", "DiDiFood", "Personalizado"
];

export default function PosContainer() {
  const db = useFirestore();
  const router = useRouter();
  const { orgId, locId } = useTenant();
  const { toast } = useToast();
  
  const menuQuery = useMemoFirebase(() => orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'menuItems'), orderBy('name', 'asc')) : null, [db, orgId, locId]);
  const catsQuery = useMemoFirebase(() => orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'categories'), orderBy('name', 'asc')) : null, [db, orgId, locId]);
  const modsQuery = useMemoFirebase(() => orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'modifiers'), orderBy('name', 'asc')) : null, [db, orgId, locId]);
  const discountsQuery = useMemoFirebase(() => orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'discounts'), orderBy('name', 'asc')) : null, [db, orgId, locId]);
  const staffQuery = useMemoFirebase(() => orgId ? collection(db, 'orgs', orgId, 'users') : null, [db, orgId]);
  const openOrdersQuery = useMemoFirebase(() => orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'orders'), where('status', '!=', 'paid'), orderBy('status'), orderBy('createdAt', 'desc')) : null, [db, orgId, locId]);
  const locRef = useMemoFirebase(() => orgId && locId ? doc(db, 'orgs', orgId, 'locations', locId) : null, [db, orgId, locId]);
  
  const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>(menuQuery);
  const { data: categories } = useCollection<Category>(catsQuery);
  const { data: allModifiers } = useCollection<ModifierGroup>(modsQuery);
  const { data: allDiscounts } = useCollection<Discount>(discountsQuery);
  const { data: staffList } = useCollection<UserProfile>(staffQuery);
  const { data: openOrders } = useCollection<Order>(openOrdersQuery);
  const { data: locationData } = useDoc<any>(locRef);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeStaff, setActiveStaff] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [modifyingItem, setModifyingItem] = useState<{item: OrderItem, index: number} | null>(null);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [isTicketsOpen, setIsTicketsOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);

  useEffect(() => {
    if (orgId && locId && activeStaff && !activeOrder) {
      setActiveOrder(createEmptyOrder());
    }
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
      tableNumber: 'Mesa 1',
      createdAt: Date.now(),
      orgId: orgId || '',
      locId: locId || '',
      staffId: activeStaff?.uid,
      staffName: activeStaff?.name
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

  const updateOrderTotals = (items: OrderItem[], discount: number = 0, dType: DiscountType = 'porcentaje') => {
    const subtotal = items.reduce((acc, i) => {
      const itemBase = i.priceAtOrder * i.quantity;
      const modsTotal = i.selectedModifiers.reduce((mAcc, m) => mAcc + (m.price * i.quantity), 0);
      return acc + itemBase + modsTotal;
    }, 0);

    let finalDiscount = discount;
    if (dType === 'porcentaje') finalDiscount = subtotal * (discount / 100);
    
    const taxableSubtotal = subtotal - finalDiscount;
    const taxRate = (locationData?.taxRate || 0) / 100;
    const tax = taxableSubtotal * taxRate;
    const total = taxableSubtotal + tax;

    setActiveOrder(prev => prev ? ({ 
      ...prev, 
      items, 
      subtotal, 
      tax, 
      total, 
      discountAmount: discount, 
      discountType: dType 
    }) : null);
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
    updateOrderTotals(newItems, activeOrder?.discountAmount, activeOrder?.discountType);
  };

  const handleSendToKitchen = async () => {
    if (!activeOrder || activeOrder.items.length === 0) return;
    try {
      const orderData = {
        ...activeOrder,
        status: 'open',
        updatedAt: serverTimestamp()
      };
      
      let firestoreId = activeOrder.firestoreId;
      if (firestoreId) {
        await updateDoc(doc(db, 'orgs', orgId!, 'locations', locId!, 'orders', firestoreId), orderData);
      } else {
        const docRef = await addDoc(collection(db, 'orgs', orgId!, 'locations', locId!, 'orders'), orderData);
        firestoreId = docRef.id;
        setActiveOrder({ ...activeOrder, firestoreId });
      }

      await addDoc(collection(db, 'orgs', orgId!, 'locations', locId!, 'kitchenTickets'), {
        orderId: activeOrder.id,
        status: 'new',
        items: activeOrder.items.map(i => ({ 
          name: i.name, 
          quantity: i.quantity, 
          modifiers: i.selectedModifiers.map(m => m.name), 
          notes: i.notes 
        })),
        timestamp: Date.now(),
        serviceType: activeOrder.serviceType,
        tableNumber: activeOrder.tableNumber,
        locId
      });

      toast({ title: "Enviado a Cocina", description: `Pedido ${activeOrder.id} está en preparación.` });
      setActiveOrder(createEmptyOrder());
    } catch (e) { toast({ variant: 'destructive', title: "Error al guardar" }); }
  };

  const completePayment = async (method: 'cash' | 'card') => {
    if (!activeOrder || activeOrder.items.length === 0) return;
    try {
      const orderData = {
        ...activeOrder,
        status: 'paid',
        payments: [{ id: Date.now().toString(), amount: activeOrder.total, method, timestamp: Date.now() }],
        paidAmount: activeOrder.total,
        updatedAt: serverTimestamp()
      };
      
      if (activeOrder.firestoreId) {
        await updateDoc(doc(db, 'orgs', orgId!, 'locations', locId!, 'orders', activeOrder.firestoreId), orderData);
      } else {
        await addDoc(collection(db, 'orgs', orgId!, 'locations', locId!, 'orders'), orderData);
      }

      toast({ title: "Venta Pagada", description: `Pedido ${activeOrder.id} finalizado.` });
      setActiveOrder(createEmptyOrder());
    } catch (e) { toast({ variant: 'destructive', title: "Error al cobrar" }); }
  };

  const selectOpenTicket = (order: Order) => {
    setActiveOrder(order);
    setIsTicketsOpen(false);
    toast({ title: `Pedido ${order.id} cargado` });
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
              <p className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase mt-2">INGRESE PIN DE ACCESO</p>
            </div>
            <div className="flex justify-center gap-3 text-4xl font-black tracking-widest text-primary h-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-12 border-b-4 border-zinc-700 pb-2">
                  {pinInput[i] ? '•' : ''}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((val) => (
                <Button key={val} variant="outline" className="h-16 text-2xl font-black rounded-2xl border-white/5 bg-zinc-800/50 hover:bg-primary active:scale-90"
                  onClick={() => {
                    if (val === 'C') setPinInput('');
                    else if (val === 'OK') handlePinSubmit();
                    else if (pinInput.length < 4) setPinInput(prev => prev + (val.toString()));
                  }}
                >{val}</Button>
              ))}
            </div>
            <Button variant="ghost" className="text-zinc-500 mt-4 font-bold uppercase text-[10px]" onClick={() => router.push('/')}>Volver al Inicio</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden">
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        <header className="flex gap-4 items-center bg-white p-3 rounded-2xl shadow-sm border-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Buscar platillo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-12 bg-muted/30 border-0 rounded-xl font-bold" />
          </div>
          
          <Button variant="outline" className="h-12 rounded-xl font-black gap-2 border-2" onClick={() => setIsTicketsOpen(true)}>
             <Receipt className="h-5 w-5" /> 
             <span className="hidden md:inline">TICKETS ABIERTOS</span>
             <Badge className="bg-primary text-white h-5 w-5 flex items-center justify-center p-0 rounded-full">{openOrders?.length || 0}</Badge>
          </Button>

          <LocationSelector />

          <Button variant="outline" className="h-12 w-12 rounded-xl border-2" onClick={() => setIsLocked(true)}>
             <LogOut className="h-5 w-5" />
          </Button>
        </header>

        <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
          <Button variant={selectedCat === 'all' ? 'default' : 'outline'} className="rounded-xl h-10 px-6 font-black uppercase italic tracking-tighter shrink-0" onClick={() => setSelectedCat('all')}>TODOS</Button>
          {categories?.map(cat => (
            <Button key={cat.id} variant={selectedCat === cat.name ? 'default' : 'outline'} className="rounded-xl h-10 px-6 font-black uppercase italic tracking-tighter shrink-0 border-2" style={selectedCat !== cat.name ? { borderColor: cat.color, color: cat.color } : { backgroundColor: cat.color }} onClick={() => setSelectedCat(cat.name)}>{cat.name}</Button>
          ))}
        </div>

        <ScrollArea className="flex-1">
          {menuLoading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className={`cursor-pointer active:scale-95 transition-all overflow-hidden border-2 hover:border-primary group shadow-sm bg-white ${item.tpvShape === 'circulo' ? 'rounded-full aspect-square' : item.tpvShape === 'hexágono' ? 'rounded-[2rem]' : 'rounded-3xl'}`} onClick={() => addItemToOrder(item)}>
                  <div className="h-full flex flex-col items-center justify-center p-4 relative" style={{ backgroundColor: `${item.tpvColor}15` }}>
                    <div className="absolute top-2 right-2"><Badge className="font-black bg-white text-primary border-2 shadow-lg">${item.price}</Badge></div>
                    {item.image ? <img src={item.image} className="w-16 h-16 rounded-xl object-cover mb-2" /> : <ShoppingBag className="h-8 w-8 mb-2" style={{ color: item.tpvColor }} />}
                    <div className="font-black text-[10px] uppercase italic tracking-tighter text-center leading-tight">{item.name}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <aside className="w-[420px] bg-white border-l-2 shadow-2xl flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-muted/10">
          <div className="flex-1">
            <div className="flex items-center gap-2">
               <h2 className="font-black text-2xl text-primary italic tracking-tighter">{activeOrder?.id}</h2>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Menu className="h-5 w-5" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 rounded-2xl p-2">
                     <DropdownMenuItem className="rounded-xl font-bold uppercase text-[10px] py-3 gap-3" onClick={() => setActiveOrder(createEmptyOrder())}><Eraser className="h-4 w-4" /> Despejar Ticket</DropdownMenuItem>
                     <DropdownMenuItem className="rounded-xl font-bold uppercase text-[10px] py-3 gap-3" onClick={() => setIsLoyaltyOpen(true)}><Gift className="h-4 w-4" /> Programa Lealtad</DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem className="rounded-xl font-bold uppercase text-[10px] py-3 gap-3"><Split className="h-4 w-4" /> Dividir Cuenta</DropdownMenuItem>
                     <DropdownMenuItem className="rounded-xl font-bold uppercase text-[10px] py-3 gap-3"><ArrowRightLeft className="h-4 w-4" /> Mover Ticket</DropdownMenuItem>
                     <DropdownMenuItem className="rounded-xl font-bold uppercase text-[10px] py-3 gap-3"><Clock className="h-4 w-4" /> Sincronizar</DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 mt-2">
               <Select value={activeOrder?.tableNumber} onValueChange={v => setActiveOrder(prev => prev ? ({...prev, tableNumber: v}) : null)}>
                  <SelectTrigger className="h-8 w-40 bg-white border-2 rounded-xl text-[10px] font-black uppercase">
                     <SelectValue placeholder="Mesa/Tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                     {SERVICE_OPTIONS.map(opt => <SelectItem key={opt} value={opt} className="rounded-xl font-bold uppercase text-[10px]">{opt}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => setActiveOrder(createEmptyOrder())}><X className="h-6 w-6" /></Button>
        </div>

        <ScrollArea className="flex-1 p-6">
           <div className="space-y-4">
              {activeOrder?.items.map((item, idx) => (
                <div key={item.id} className="group border-b-2 border-dashed pb-4 mb-2">
                   <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                         <div className="flex flex-col items-center bg-primary/10 rounded-lg p-1 min-w-[32px]">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                               const newItems = [...activeOrder.items];
                               newItems[idx].quantity += 1;
                               updateOrderTotals(newItems, activeOrder.discountAmount, activeOrder.discountType);
                            }}><Plus className="h-3 w-3" /></Button>
                            <span className="font-black text-lg py-1">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                               const newItems = [...activeOrder.items];
                               if (newItems[idx].quantity > 1) newItems[idx].quantity -= 1;
                               else newItems.splice(idx, 1);
                               updateOrderTotals(newItems, activeOrder.discountAmount, activeOrder.discountType);
                            }}><Minus className="h-3 w-3" /></Button>
                         </div>
                         <div>
                            <h4 className="font-black text-sm uppercase italic leading-tight">{item.name}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                               {item.selectedModifiers.map((m, mIdx) => <Badge key={mIdx} variant="secondary" className="text-[8px] font-bold">+{m.name}</Badge>)}
                               {item.notes && <Badge variant="outline" className="text-[8px] italic">{item.notes}</Badge>}
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="font-black text-primary">${((item.priceAtOrder + item.selectedModifiers.reduce((acc, m) => acc + m.price, 0)) * item.quantity).toFixed(2)}</span>
                         <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100">
                            <Button variant="ghost" size="icon" className="h-7 w-7 bg-muted" onClick={() => setModifyingItem({ item, index: idx })}><MessageSquare className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                               const newItems = [...activeOrder.items];
                               newItems.splice(idx, 1);
                               updateOrderTotals(newItems, activeOrder.discountAmount, activeOrder.discountType);
                            }}><Trash2 className="h-3 w-3" /></Button>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
              {activeOrder?.items.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 opacity-20">
                   <ShoppingBag className="h-16 w-16 mb-4" />
                   <p className="font-black uppercase tracking-widest text-xs">Ticket Vacío</p>
                </div>
              )}
           </div>
        </ScrollArea>

        <div className="p-8 bg-[#F8F9FA] space-y-4 border-t-4 border-t-primary shadow-xl">
           <div className="space-y-1">
             <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground"><span>Subtotal</span><span>${activeOrder?.subtotal.toFixed(2)}</span></div>
             <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase"><span>IVA ({locationData?.taxRate || 0}%)</span><span>${activeOrder?.tax.toFixed(2)}</span></div>
           </div>
           
           <div className="flex justify-between items-center">
              <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
                 <DialogTrigger asChild><Button variant="outline" className="h-10 rounded-xl font-black gap-2 border-2"><Tag className="h-4 w-4" /> DESCUENTOS</Button></DialogTrigger>
                 <DialogContent className="rounded-[2rem] p-8">
                    <DialogHeader><DialogTitle className="font-black uppercase italic text-2xl">Promociones</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                       {allDiscounts?.map(d => (
                         <Button key={d.id} variant="outline" className="h-20 flex flex-col rounded-2xl border-2" onClick={() => { updateOrderTotals(activeOrder?.items || [], d.value, d.type); setIsDiscountOpen(false); }}>
                            <span className="font-black text-xs uppercase">{d.name}</span>
                            <span className="text-xl font-black text-primary">{d.type === 'porcentaje' ? `${d.value}%` : `$${d.value}`}</span>
                         </Button>
                       ))}
                       <Button variant="ghost" className="h-20 border-2 border-dashed rounded-2xl" onClick={() => { updateOrderTotals(activeOrder?.items || [], 0); setIsDiscountOpen(false); }}>QUITAR DESCUENTOS</Button>
                    </div>
                 </DialogContent>
              </Dialog>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-muted-foreground">Total</p>
                 <h3 className="text-5xl font-black italic tracking-tighter text-primary leading-none">${activeOrder?.total.toFixed(2)}</h3>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-3 pt-2">
              <Button className="h-14 font-black text-lg bg-orange-600 hover:bg-orange-700 shadow-lg rounded-2xl text-white" onClick={handleSendToKitchen}>
                <Save className="mr-2 h-5 w-5" /> ENVIAR A COCINA (GUARDAR)
              </Button>
              <div className="grid grid-cols-2 gap-3">
                 <Button className="h-14 font-black text-lg bg-green-600 hover:bg-green-700 shadow-xl rounded-2xl text-white border-b-4 border-green-800" onClick={() => completePayment('cash')}><Banknote className="mr-2" /> EFECTIVO</Button>
                 <Button className="h-14 font-black text-lg bg-blue-600 hover:bg-blue-700 shadow-xl rounded-2xl text-white border-b-4 border-blue-800" onClick={() => completePayment('card')}><CreditCard className="mr-2" /> TARJETA</Button>
              </div>
           </div>
        </div>
      </aside>

      <Dialog open={isTicketsOpen} onOpenChange={setIsTicketsOpen}>
         <DialogContent className="rounded-[2.5rem] p-10 max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
               <DialogTitle className="font-black text-3xl uppercase italic text-primary flex items-center gap-3">
                  <Receipt className="h-8 w-8" /> Mis Tickets Abiertos
               </DialogTitle>
               <DialogDescription className="font-bold uppercase text-[10px] tracking-widest">Gestiona tus pedidos en curso</DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 items-center mt-6">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por ID, mesa o cliente..." className="pl-12 rounded-xl h-12" />
               </div>
               <Select defaultValue="fecha">
                  <SelectTrigger className="w-40 rounded-xl h-12 font-bold uppercase text-[10px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                     <SelectItem value="fecha" className="font-bold uppercase text-[10px]">Fecha</SelectItem>
                     <SelectItem value="mesa" className="font-bold uppercase text-[10px]">Mesa</SelectItem>
                     <SelectItem value="total" className="font-bold uppercase text-[10px]">Total</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <ScrollArea className="flex-1 mt-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                  {openOrders?.map(order => (
                    <Card key={order.id} className="rounded-2xl border-2 hover:border-primary transition-all cursor-pointer group" onClick={() => selectOpenTicket(order)}>
                       <CardContent className="p-4 flex justify-between items-center">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2">
                                <Badge variant={order.status === 'open' ? 'default' : 'secondary'} className="rounded-lg text-[8px] font-black uppercase">{order.status}</Badge>
                                <span className="font-black text-primary italic text-lg">{order.id}</span>
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                <Utensils className="h-3 w-3" /> {order.tableNumber}
                                <span className="mx-1">•</span>
                                <Clock className="h-3 w-3" /> {new Date(order.createdAt).toLocaleTimeString()}
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="font-black text-2xl">${order.total.toFixed(2)}</div>
                             <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10" onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (confirm("¿Borrar ticket?")) {
                                    deleteDoc(doc(db, 'orgs', orgId!, 'locations', locId!, 'orders', order.firestoreId!));
                                  }
                                }}><Trash className="h-4 w-4" /></Button>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </ScrollArea>
         </DialogContent>
      </Dialog>

      <Dialog open={isLoyaltyOpen} onOpenChange={setIsLoyaltyOpen}>
         <DialogContent className="rounded-[2.5rem] p-10 max-w-md">
            <DialogHeader>
               <DialogTitle className="font-black text-3xl uppercase italic text-primary">Programa Lealtad</DialogTitle>
               <DialogDescription className="font-bold uppercase text-[10px] tracking-widest">Asignar cliente para recompensas</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Buscar Cliente</Label>
                  <Input placeholder="Nombre o Teléfono..." className="h-12 rounded-xl" />
               </div>
               <Button className="w-full h-14 font-black rounded-xl" onClick={() => setIsLoyaltyOpen(false)}>CERRAR</Button>
            </div>
         </DialogContent>
      </Dialog>

      <Dialog open={!!modifyingItem} onOpenChange={() => setModifyingItem(null)}>
         <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl">
            <DialogHeader><DialogTitle className="font-black text-3xl uppercase italic text-primary">Modificadores: {modifyingItem?.item.name}</DialogTitle></DialogHeader>
            <div className="space-y-6 pt-6">
               {allModifiers?.filter(m => menuItems?.find(mi => mi.id === modifyingItem?.item.menuItemId)?.modifierIds.includes(m.id!)).map(group => (
                 <div key={group.id} className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground">{group.name}</Label>
                   <div className="flex flex-wrap gap-2">
                      {group.options.map((opt, i) => {
                        const isSelected = modifyingItem?.item.selectedModifiers.some(m => m.name === opt.name);
                        return (
                          <Button key={i} variant={isSelected ? 'default' : 'outline'} className="rounded-xl font-bold h-12 px-6" onClick={() => {
                             const newItems = [...(activeOrder?.items || [])];
                             const currentMods = [...newItems[modifyingItem!.index].selectedModifiers];
                             if (isSelected) newItems[modifyingItem!.index].selectedModifiers = currentMods.filter(m => m.name !== opt.name);
                             else newItems[modifyingItem!.index].selectedModifiers = [...currentMods, opt];
                             updateOrderTotals(newItems, activeOrder?.discountAmount, activeOrder?.discountType);
                          }}>{opt.name} <span className="ml-2 text-[10px] opacity-60">+${opt.price}</span></Button>
                        );
                      })}
                   </div>
                 </div>
               ))}
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Notas Especiales</Label>
                  <Input value={modifyingItem?.item.notes || ''} onChange={e => {
                     const newItems = [...(activeOrder?.items || [])];
                     newItems[modifyingItem!.index].notes = e.target.value;
                     updateOrderTotals(newItems, activeOrder?.discountAmount, activeOrder?.discountType);
                  }} className="h-12 rounded-xl" />
               </div>
               <Button className="w-full h-14 font-black rounded-xl" onClick={() => setModifyingItem(null)}>CONFIRMAR</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
