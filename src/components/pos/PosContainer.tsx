
"use client"

import React, { useState, useEffect } from 'react';
import { MenuItem, Order, Payment, OrderItem, UserProfile } from '@/lib/types';
import { 
  Plus, Minus, Trash2, CreditCard, Banknote, X, ShoppingBag, 
  RefreshCw, ArrowLeft, User, MessageSquare, Save, Wallet, Search, Loader2, KeyRound, LogOut 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useTenant, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, addDoc } from 'firebase/firestore';

const TAX_RATE = 0.08;
const CARD_COMMISSION_RATE = 0.0406;

export default function PosContainer() {
  const db = useFirestore();
  const router = useRouter();
  const { orgId, locId } = useTenant();
  const { toast } = useToast();
  
  const menuQuery = useMemoFirebase(() => orgId && locId ? query(collection(db, 'orgs', orgId, 'locations', locId, 'menuItems'), orderBy('name', 'asc')) : null, [db, orgId, locId]);
  const staffQuery = useMemoFirebase(() => orgId ? collection(db, 'orgs', orgId, 'users') : null, [db, orgId]);
  
  const { data: menuItems, isLoading: menuLoading } = useCollection<MenuItem>(menuQuery);
  const { data: staffList } = useCollection<UserProfile>(staffQuery);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeStaff, setActiveStaff] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
      
      // Registrar asistencia (Check-in)
      try {
        await addDoc(collection(db, 'orgs', orgId!, 'locations', locId!, 'attendance'), {
          userId: found.uid || found.id,
          userName: found.name,
          timestamp: Date.now(),
          type: 'in',
          locId
        });
        toast({ title: `Hola, ${found.name}`, description: "Asistencia registrada correctamente." });
      } catch (e) { console.error(e); }
    } else {
      toast({ variant: 'destructive', title: "PIN Incorrecto", description: "Verifique sus credenciales de empleado." });
      setPinInput('');
    }
  };

  const handleLogoutStaff = () => {
    setIsLocked(true);
    setActiveStaff(null);
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
              <p className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase mt-2">Ingrese su PIN de Empleado</p>
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
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
               <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">Operador Activo</p>
              <p className="font-black text-base uppercase italic">{activeStaff?.name}</p>
            </div>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="font-bold gap-2 rounded-xl" onClick={handleLogoutStaff}>
                <LogOut className="h-4 w-4" /> CAMBIAR OPERADOR
             </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {menuLoading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
              {menuItems?.map((item) => (
                <Card key={item.id} className="cursor-pointer active:scale-95 transition-all overflow-hidden border-2 hover:border-primary group rounded-2xl shadow-sm" onClick={() => {
                  const newItem = { id: Date.now().toString(), menuItemId: item.id!, name: item.name, quantity: 1, priceAtOrder: item.price, selectedModifiers: [] };
                  setActiveOrder(prev => {
                    if (!prev) return null;
                    const items = [...prev.items, newItem];
                    const subtotal = items.reduce((acc, i) => acc + (i.priceAtOrder * i.quantity), 0);
                    const tax = subtotal * TAX_RATE;
                    return { ...prev, items, subtotal, tax, total: subtotal + tax };
                  });
                }}>
                  <div className="h-32 bg-muted relative">
                    {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                    <div className="absolute top-2 right-2"><Badge className="font-black bg-primary px-3 py-1 shadow-lg">${item.price}</Badge></div>
                  </div>
                  <div className="p-4 bg-white">
                    <div className="font-black text-sm uppercase italic tracking-tighter leading-tight">{item.name}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="w-96 bg-white border-l shadow-2xl flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">Ticket de Venta</p>
            <h2 className="font-black text-2xl text-primary italic tracking-tighter">{activeOrder?.id}</h2>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10" onClick={() => setActiveOrder(createEmptyOrder())}><X className="text-destructive" /></Button>
        </div>
        <ScrollArea className="flex-1 p-6">
           {activeOrder?.items.map((item, idx) => (
             <div key={idx} className="flex justify-between font-black mb-4 border-b border-dashed pb-2">
                <div className="flex flex-col">
                  <span className="text-sm uppercase italic">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground">Cant: {item.quantity}</span>
                </div>
                <span className="text-primary">${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
             </div>
           ))}
           {(!activeOrder || activeOrder.items.length === 0) && (
             <div className="flex h-full flex-col items-center justify-center text-muted-foreground opacity-30 mt-20">
               <ShoppingBag className="h-20 w-20 mb-4" />
               <p className="font-black uppercase tracking-widest text-xs">Sin Productos</p>
             </div>
           )}
        </ScrollArea>
        <div className="p-8 bg-zinc-50 space-y-4 border-t-2">
           <div className="space-y-1">
             <div className="flex justify-between text-xs font-bold text-muted-foreground"><span>SUBTOTAL</span><span>${activeOrder?.subtotal.toFixed(2)}</span></div>
             <div className="flex justify-between text-xs font-bold text-muted-foreground"><span>IVA (8%)</span><span>${activeOrder?.tax.toFixed(2)}</span></div>
           </div>
           <div className="flex justify-between text-3xl font-black italic tracking-tighter">
             <span>TOTAL</span>
             <span className="text-primary">${activeOrder?.total.toFixed(2)}</span>
           </div>
           <div className="grid grid-cols-2 gap-3 mt-4">
              <Button className="h-16 font-black uppercase italic tracking-tighter text-lg bg-green-600 hover:bg-green-700 shadow-xl shadow-green-200 rounded-2xl" onClick={() => toast({title: "Pago en Efectivo", description: "Venta registrada exitosamente."})}>
                <Banknote className="mr-2 h-5 w-5" /> EFECTIVO
              </Button>
              <Button className="h-16 font-black uppercase italic tracking-tighter text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 rounded-2xl" onClick={() => {
                const amount = activeOrder?.total || 0;
                const net = amount - (amount * CARD_COMMISSION_RATE);
                toast({title: "Pago con Tarjeta", description: `Comisión aplicada (4.06%). Neto: $${net.toFixed(2)}`});
              }}>
                <CreditCard className="mr-2 h-5 w-5" /> TARJETA
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
