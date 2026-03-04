"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { KitchenTicket, TicketStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Flame, ChefHat, Bell, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useTenant, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG = {
  new: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800', icon: <Bell className="h-4 w-4" /> },
  preparing: { label: 'En Preparación', color: 'bg-orange-100 text-orange-800', icon: <Flame className="h-4 w-4" /> },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  served: { label: 'Servido', color: 'bg-gray-100 text-gray-800', icon: <ChefHat className="h-4 w-4" /> },
};

export default function KdsContainer() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { orgId, locId } = useTenant();
  
  // Query multi-tenant correcta y memoizada para evitar errores de permisos/hidratación
  const ticketsQuery = useMemoFirebase(() => 
    orgId && locId ? query(
      collection(db, 'orgs', orgId, 'locations', locId, 'kitchenTickets'), 
      orderBy('timestamp', 'asc')
    ) : null, [db, orgId, locId]
  );

  const { data: allTickets, isLoading } = useCollection<KitchenTicket>(ticketsQuery);

  const tickets = useMemo(() => 
    allTickets ? allTickets.filter(t => t.status !== 'served') : [], 
    [allTickets]
  );

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  const updateTicketStatus = async (ticketId: string, nextStatus: TicketStatus) => {
    if (!orgId || !locId) return;
    try {
      const ticketRef = doc(db, 'orgs', orgId, 'locations', locId, 'kitchenTickets', ticketId);
      await updateDoc(ticketRef, { status: nextStatus });
      toast({ title: 'Estado Actualizado' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const getElapsedTime = (timestamp: number) => {
    const mins = Math.floor((now - timestamp) / 60000);
    return mins < 1 ? 'ahora' : `hace ${mins}m`;
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-primary p-4 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 rounded-full cursor-pointer"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8" />
            <h1 className="text-2xl font-bold uppercase tracking-tighter italic">Cocina (KDS)</h1>
          </div>
        </div>
        <div className="flex gap-4">
          <Badge className="bg-white/20 text-white border-none text-lg px-4 py-1 font-black">
            PEDIDOS ACTIVOS: {tickets.length}
          </Badge>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6">
        {!locId ? (
          <div className="flex h-64 items-center justify-center opacity-40">
            <p className="text-xl font-bold italic uppercase tracking-widest">Seleccione una sucursal para ver los pedidos</p>
          </div>
        ) : isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground opacity-50">
            <ChefHat className="h-20 w-20 mb-4" />
            <p className="text-xl font-bold uppercase italic">¡Cocina despejada!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className={`overflow-hidden border-2 flex flex-col h-[450px] shadow-xl rounded-[2rem] ${ticket.status === 'new' ? 'border-primary animate-pulse' : 'border-border'}`}>
                <CardHeader className={`${STATUS_CONFIG[ticket.status].color} py-4 px-6 flex-row justify-between items-center space-y-0`}>
                  <div>
                    <CardTitle className="text-xl font-black italic tracking-tighter">
                      #{ticket.orderId.split('-')[1] || ticket.orderId}
                    </CardTitle>
                    <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">{ticket.serviceType} • {ticket.tableNumber}</p>
                  </div>
                  <div className="text-sm font-black flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {getElapsedTime(ticket.timestamp)}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-6 overflow-hidden bg-white">
                  <ScrollArea className="h-full pr-2">
                    <ul className="space-y-4">
                      {ticket.items.map((item, idx) => (
                        <li key={idx} className="border-b-2 border-dashed pb-3 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="bg-primary/10 text-primary font-black px-2 py-1 rounded-lg text-lg min-w-[32px] text-center">
                              {item.quantity}
                            </span>
                            <span className="font-black text-lg leading-none uppercase italic tracking-tighter">{item.name}</span>
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 ml-10">
                              {item.modifiers.map((m, mIdx) => (
                                <Badge key={mIdx} variant="secondary" className="text-[9px] font-bold border-primary/20">+{m}</Badge>
                              ))}
                            </div>
                          )}
                          {item.notes && (
                            <div className="mt-2 ml-10 bg-muted/40 p-2 rounded-xl border-l-4 border-primary flex gap-2 items-start">
                              <MessageSquare className="h-3 w-3 text-primary mt-1 shrink-0" />
                              <p className="text-[11px] font-bold italic text-muted-foreground leading-tight">
                                "{item.notes}"
                              </p>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="p-6 bg-muted/30 grid grid-cols-1 gap-2 mt-auto border-t">
                  {ticket.status === 'new' && (
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-white font-black h-14 text-lg rounded-2xl shadow-lg shadow-primary/20" 
                      onClick={() => updateTicketStatus(ticket.id!, 'preparing')}
                    >
                      EMPEZAR PREPARACIÓN
                    </Button>
                  )}
                  {ticket.status === 'preparing' && (
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white font-black h-14 text-lg rounded-2xl shadow-lg shadow-green-600/20"
                      onClick={() => updateTicketStatus(ticket.id!, 'ready')}
                    >
                      MARCAR COMO LISTO
                    </Button>
                  )}
                  {ticket.status === 'ready' && (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black h-14 text-lg rounded-2xl shadow-lg shadow-blue-600/20"
                      onClick={() => updateTicketStatus(ticket.id!, 'served')}
                    >
                      ENTREGAR / SERVIR
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}