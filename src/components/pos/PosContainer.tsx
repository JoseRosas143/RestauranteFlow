"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Order, Payment, OrderItem, ServiceType, Modifier, ModifierOption, Customer, LoyaltySettings, UserProfile } from '@/lib/types';
import { 
  Plus, Minus, Trash2, CreditCard, Banknote, X, ShoppingBag, 
  RefreshCw, ArrowLeft, User, MessageSquare, Save, Wallet, Search, Loader2, KeyRound, LogOut 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useTenant, useMemoFirebase } from '@/firebase';
import { collection, doc, runTransaction, query, orderBy, increment, addDoc } from 'firebase/firestore';
import LocationSelector from '@/components/tenant/LocationSelector';

const TAX_RATE = 0.08;
const CARD_COMMISSION_RATE = 0.0406;

export default function PosContainer() {
  const db = useFirestore();
  const router = useRouter();
  const { orgId, locId } = useTenant();
  
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
          userId: found.uid,
          userName: found.name,
          timestamp: Date.now(),
          type: 'in',
          locId
        });
        toast({ title: `Hola, ${found.name}`, description: "Asistencia registrada." });
      } catch (e) { console.error(e); }
    } else {
      toast({ variant: 'destructive', title: "PIN Incorrecto" });
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
              <h1 className="text-3xl font-black italic uppercase tracking-tighter">Terminal POS</h1>
              <p className="text-xs font-bold text-zinc-500 tracking-[0.2em] uppercase mt-1">Ingrese su PIN de Empleado</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-4xl font-black tracking-widest text-primary h-12">
              {pinInput.padEnd(4, '•').split('').map((char, i) => (
                <div key={i} className="border-b-4 border-zinc-700 pb-2">{char}</div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((val) => (
                <Button 
                  key={val} 
                  variant="outline" 
                  className="h-16 text-2xl font-black rounded-2xl border-white/5 hover:bg-primary hover:text-white"
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
            <Button variant="ghost" className="text-zinc-500 mt-4" onClick={() => router.push('/')}>Volver al Inicio</Button>
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
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
               <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">Personal Activo</p>
              <p className="font-black text-sm">{activeStaff?.name}</p>
            </div>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" size="sm" className="font-bold gap-2" onClick={handleLogoutStaff}>
                <LogOut className="h-4 w-4" /> CAMBIAR USUARIO
             </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {menuLoading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
              {menuItems?.map((item) => (
                <Card key={item.id} className="cursor-pointer active:scale-95 transition-all overflow-hidden" onClick={() => {
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
                    <div className="absolute top-2 right-2"><Badge className="font-bold bg-primary">${item.price}</Badge></div>
                  </div>
                  <div className="p-3 font-bold text-sm truncate">{item.name}</div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="w-96 bg-white border-l shadow-2xl flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
          <h2 className="font-black text-xl text-primary">{activeOrder?.id}</h2>
          <Button variant="ghost" size="icon" onClick={() => setActiveOrder(createEmptyOrder())}><X /></Button>
        </div>
        <ScrollArea className="flex-1 p-4">
           {activeOrder?.items.map((item, idx) => (
             <div key={idx} className="flex justify-between font-bold mb-4 border-b pb-2">
                <span>{item.name} x{item.quantity}</span>
                <span>${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
             </div>
           ))}
        </ScrollArea>
        <div className="p-6 bg-primary/5 space-y-4 border-t">
           <div className="flex justify-between text-2xl font-black"><span>TOTAL</span><span className="text-primary">${activeOrder?.total.toFixed(2)}</span></div>
           <Button className="w-full h-16 text-xl font-black shadow-xl" onClick={() => toast({title: "Procesando pago..."})}>COBRAR</Button>
        </div>
      </div>
    </div>
  );
}
