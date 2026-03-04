"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Order, OrderItem, UserProfile, Category, ServiceType, DiscountType, ModifierGroup, Discount } from '@/lib/types';
import { 
  Plus, Minus, Trash2, CreditCard, Banknote, X, ShoppingBag, 
  Search, Loader2, KeyRound, LogOut, Tag, Receipt, ChevronRight, 
  Menu, Save, Utensils, Clock, Gift, ArrowRightLeft, Eraser, Trash,
  Edit3, MessageSquare, Check, Sliders, Smartphone
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useTenant, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, orderBy, addDoc, serverTimestamp, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LocationSelector from '@/components/tenant/LocationSelector';
import { Separator } from '@/components/ui/separator';

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
  const openOrdersQuery = useMemoFirebase(() => orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'orders'), where('status', '!=', 'paid'), orderBy('status')) : null, [db, orgId, locId]);
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
  const [isTicketsOpen, setIsTicketsOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);

  // Estados para modificar un item
  const [modifyingItem, setModifyingItem] = useState<{item: OrderItem, index: number} | null>(null);
  const [modifyingNotes, setModifyingNotes] = useState('');
  const [modifyingSelectedMods, setModifyingSelectedMods] = useState<{name: string, price: number}[]>([]);
  const [modifyingDiscount, setModifyingDiscount] = useState<{value: number, type: DiscountType} | null>(null);

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

  const updateOrderTotals = (items: OrderItem[]) => {
    const subtotal = items.reduce((acc, i) => {
      const itemBase = i.priceAtOrder * i.quantity;
      const modsTotal = (i.selectedModifiers || []).reduce((mAcc, m) => mAcc + (m.price * i.quantity), 0);
      let itemTotal = itemBase + modsTotal;
      
      if (i.discountValue) {
        if (i.discountType === 'porcentaje') itemTotal -= itemTotal * (i.discountValue / 100);
        else itemTotal -= i.discountValue * i.quantity;
      }
      
      return acc + itemTotal;
    }, 0);

    const taxRate = (locationData?.taxRate || 0) / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    setActiveOrder(prev => prev ? ({ 
      ...prev, 
      items, 
      subtotal, 
      tax, 
      total,
      discountAmount: items.reduce((acc, i) => acc + (i.discountValue || 0), 0)
    }) : null);
  };

  const addItemToOrder = (menuItem: MenuItem) => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      menuItemId: menuItem.id!,
      name: menuItem.name,
      quantity: 1,
      priceAtOrder: menuItem.price,
      selectedModifiers: [],
      notes: ''
    };
    
    const newItems = [...(activeOrder?.items || []), newItem];
    const newIdx = newItems.length - 1;

    if ((menuItem.modifierIds && menuItem.modifierIds.length > 0)) {
        setModifyingItem({ item: newItem, index: newIdx });
        setModifyingNotes('');
        setModifyingSelectedMods([]);
        setModifyingDiscount(null);
    }

    updateOrderTotals(newItems);
  };

  const openItemEditor = (item: OrderItem, index: number) => {
    setModifyingItem({ item, index });
    setModifyingNotes(item.notes || '');
    setModifyingSelectedMods(item.selectedModifiers || []);
    setModifyingDiscount(item.discountValue ? { value: item.discountValue, type: item.discountType || 'porcentaje' } : null);
  };

  const saveItemModifications = () => {
    if (!modifyingItem || !activeOrder) return;
    
    const newItems = [...activeOrder.items];
    newItems[modifyingItem.index] = {
      ...newItems[modifyingItem.index],
      notes: modifyingNotes,
      selectedModifiers: modifyingSelectedMods,
      discountValue: modifyingDiscount?.value,
      discountType: modifyingDiscount?.type
    };
    
    updateOrderTotals(newItems);
    setModifyingItem(null);
    toast({ title: "Cambios aplicados" });
  };

  const handleSendToKitchen = async () => {
    if (!activeOrder || activeOrder.items.length === 0) {
      toast({ variant: 'destructive', title: "Ticket vacío" });
      return;
    }
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
        locId: locId!
      });

      toast({ title: "Enviado a Cocina", description: `Pedido ${activeOrder.id} está en preparación.` });
      setActiveOrder(createEmptyOrder());
    } catch (e) { 
      console.error("Error saving order:", e);
      toast({ variant: 'destructive', title: "Error al guardar" }); 
    }
  };

  const completePayment = async (method: 'cash' | 'card' | 'transfer') => {
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

      toast({ title: "Venta Pagada", description: `Pedido ${activeOrder.id} finalizado vía ${method === 'transfer' ? 'Transferencia' : method}.` });
      setActiveOrder(createEmptyOrder());
    } catch (e) { 
        console.error("Error processing payment:", e);
        toast({ variant: 'destructive', title: "Error al procesar pago" }); 
    }
  };

  const selectOpenTicket = (order: Order) => {
    setActiveOrder(order);
    setIsTicketsOpen(false);
    toast({ title: `Pedido ${order.id} cargado` });
  };

  const currentItemInMenu = useMemo(() => {
    if (!modifyingItem) return null;
    return menuItems?.find(mi => mi.id === modifyingItem.item.menuItemId);
  }, [modifyingItem, menuItems]);

  const availableModifiers = useMemo(() => {
    if (!currentItemInMenu || !allModifiers) return [];
    return allModifiers.filter(m => currentItemInMenu.modifierIds?.includes(m.id!));
  }, [currentItemInMenu, allModifiers]);

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
                <Button key={val} variant="outline" className="h-16 text-2xl font-black rounded-2xl border-white/5 bg-zinc-800/50 hover:bg-primary transition-all active:scale-90"
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
             <span className="hidden md:inline uppercase text-[10px] tracking-widest">Tickets Abiertos</span>
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
                               updateOrderTotals(newItems);
                            }}><Plus className="h-3 w-3" /></Button>
                            <span className="font-black text-lg py-1">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                               const newItems = [...activeOrder.items];
                               if (newItems[idx].quantity > 1) newItems[idx].quantity -= 1;
                               else newItems.splice(idx, 1);
                               updateOrderTotals(newItems);
                            }}><Minus className="h-3 w-3" /></Button>
                         </div>
                         <div className="cursor-pointer flex-1">
                            <h4 className="font-black text-sm uppercase italic leading-tight group-hover:text-primary transition-colors">{item.name}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                               {item.selectedModifiers?.map((m, mIdx) => <Badge key={mIdx} variant="secondary" className="text-[8px] font-bold">+{m.name}</Badge>)}
                               {item.notes && <Badge variant="outline" className="text-[8px] italic border-primary/40"><MessageSquare className="h-2 w-2 mr-1" /> {item.notes}</Badge>}
                               {item.discountValue && <Badge className="text-[8px] bg-accent text-white border-0">DESC: {item.discountType === 'porcentaje' ? `${item.discountValue}%` : `$${item.discountValue}`}</Badge>}
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="font-black text-primary">
                            ${(((item.priceAtOrder + (item.selectedModifiers?.reduce((acc, m) => acc + m.price, 0) || 0)) * item.quantity) - (item.discountValue ? (item.discountType === 'porcentaje' ? (item.priceAtOrder * item.quantity * (item.discountValue / 100)) : (item.discountValue * item.quantity)) : 0)).toFixed(2)}
                         </span>
                         <div className="flex flex-col gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all items-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 px-2 text-[8px] font-black uppercase rounded-lg border-primary/20 text-primary hover:bg-primary/10"
                              onClick={() => openItemEditor(item, idx)}
                            >
                              <Sliders className="h-3 w-3 mr-1" /> MODIFICADORES
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                               const newItems = [...activeOrder.items];
                               newItems.splice(idx, 1);
                               updateOrderTotals(newItems);
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
           
           <div className="flex justify-end items-center">
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-muted-foreground">Total</p>
                 <h3 className="text-5xl font-black italic tracking-tighter text-primary leading-none">${activeOrder?.total.toFixed(2)}</h3>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-3 pt-2">
              <Button className="h-14 font-black text-lg bg-orange-600 hover:bg-orange-700 shadow-lg rounded-2xl text-white" onClick={handleSendToKitchen}>
                <Save className="mr-2 h-5 w-5" /> ENVIAR A COCINA (GUARDAR)
              </Button>
              <div className="grid grid-cols-3 gap-3">
                 <Button className="h-14 font-black text-xs bg-green-600 hover:bg-green-700 shadow-xl rounded-2xl text-white border-b-4 border-green-800 p-1" onClick={() => completePayment('cash')}><Banknote className="h-4 w-4 mb-1" /> EFECTIVO</Button>
                 <Button className="h-14 font-black text-xs bg-blue-600 hover:bg-blue-700 shadow-xl rounded-2xl text-white border-b-4 border-blue-800 p-1" onClick={() => completePayment('card')}><CreditCard className="h-4 w-4 mb-1" /> TARJETA</Button>
                 <Button className="h-14 font-black text-xs bg-zinc-700 hover:bg-zinc-800 shadow-xl rounded-2xl text-white border-b-4 border-zinc-900 p-1" onClick={() => completePayment('transfer')}><Smartphone className="h-4 w-4 mb-1" /> TRANSF.</Button>
              </div>
           </div>
        </div>
      </aside>

      <Dialog open={!!modifyingItem} onOpenChange={(open) => !open && setModifyingItem(null)}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-primary">
                    Opciones de {modifyingItem?.item.name}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest">
                    Seleccione modificadores, descuentos e instrucciones especiales
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Instrucciones Especiales</Label>
                    <Textarea 
                        placeholder="Ej: Sin cebolla, término medio, etc." 
                        value={modifyingNotes} 
                        onChange={(e) => setModifyingNotes(e.target.value)}
                        className="rounded-2xl border-2 min-h-[80px] bg-muted/20 focus-visible:ring-primary font-bold"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1 flex items-center gap-2"><Tag className="h-3 w-3" /> Aplicar Descuento al Producto</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {allDiscounts?.map(d => (
                            <Button 
                                key={d.id} 
                                variant={modifyingDiscount?.value === d.value ? "default" : "outline"}
                                className="h-12 rounded-xl border-2 font-black text-[10px]"
                                onClick={() => setModifyingDiscount({ value: d.value, type: d.type })}
                            >
                                {d.name} ({d.type === 'porcentaje' ? `${d.value}%` : `$${d.value}`})
                            </Button>
                        ))}
                        <Button 
                            variant="ghost" 
                            className="h-12 border-2 border-dashed rounded-xl font-black text-[10px]"
                            onClick={() => setModifyingDiscount(null)}
                        >
                            SIN DESCUENTO
                        </Button>
                    </div>
                </div>

                <Separator />

                {availableModifiers.length > 0 ? (
                    <div className="space-y-4">
                        {availableModifiers.map((group) => (
                            <div key={group.id} className="space-y-2">
                                <p className="text-[10px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-lg border-l-2 border-primary">{group.name}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {group.options.map((opt, idx) => {
                                        const isSelected = modifyingSelectedMods.some(m => m.name === opt.name);
                                        return (
                                            <Button 
                                                key={idx} 
                                                variant={isSelected ? "default" : "outline"}
                                                className={`h-12 rounded-xl border-2 flex justify-between px-3 group transition-all ${isSelected ? 'shadow-md scale-[1.02] bg-primary text-white border-primary' : 'hover:border-primary/40'}`}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setModifyingSelectedMods(modifyingSelectedMods.filter(m => m.name !== opt.name));
                                                    } else {
                                                        setModifyingSelectedMods([...modifyingSelectedMods, { name: opt.name, price: Number(opt.price) || 0 }]);
                                                    }
                                                }}
                                            >
                                                <span className="text-[10px] font-black uppercase truncate">{opt.name}</span>
                                                <span className={`text-[10px] font-black opacity-60 ${isSelected ? 'text-white' : 'text-primary'}`}>
                                                  {opt.price > 0 ? `+$${opt.price}` : 'GRATIS'}
                                                </span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                  <div className="py-4 text-center bg-muted/20 rounded-2xl border-2 border-dashed">
                     <p className="text-[10px] font-black uppercase text-muted-foreground italic">No hay modificadores disponibles</p>
                  </div>
                )}
            </div>

            <DialogFooter className="sticky bottom-0 bg-white pt-4">
                <Button className="w-full h-14 font-black text-lg rounded-2xl shadow-xl" onClick={saveItemModifications}>
                    <Check className="mr-2" /> CONFIRMAR SELECCIÓN
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTicketsOpen} onOpenChange={setIsTicketsOpen}>
         <DialogContent className="rounded-[2.5rem] p-10 max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
               <DialogTitle className="font-black text-3xl uppercase italic text-primary flex items-center gap-3">
                  <Receipt className="h-8 w-8" /> Tickets Abiertos
               </DialogTitle>
               <DialogDescription className="font-bold uppercase text-[10px] tracking-widest">Gestione sus pedidos activos</DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 items-center mt-6">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por ID o mesa..." className="pl-12 rounded-xl h-12" />
               </div>
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
    </div>
  );
}