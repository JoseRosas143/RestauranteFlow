
"use client"

import React, { useState, useEffect } from 'react';
import { KitchenTicket, TicketStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Flame, ChefHat, Bell, Loader2, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import Link from 'next/link';

const STATUS_CONFIG = {
  new: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800', icon: <Bell className="h-4 w-4" /> },
  preparing: { label: 'En Preparación', color: 'bg-orange-100 text-orange-800', icon: <Flame className="h-4 w-4" /> },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  served: { label: 'Servido', color: 'bg-gray-100 text-gray-800', icon: <ChefHat className="h-4 w-4" /> },
};

export default function KdsContainer() {
  const db = useFirestore();
  const { data: tickets, loading } = useCollection<KitchenTicket>(
    query(collection(db, 'tickets'), where('status', '!=', 'served'), orderBy('status', 'asc'), orderBy('timestamp', 'asc'))
  );

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  const updateTicketStatus = async (ticketId: string, nextStatus: TicketStatus) => {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, { status: nextStatus });
      toast({ title: 'Estado Actualizado', description: `El ticket ahora está ${STATUS_CONFIG[nextStatus].label}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
    }
  };

  const getElapsedTime = (timestamp: number) => {
    const mins = Math.floor((now - timestamp) / 60000);
    return `hace ${mins}m`;
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-primary p-4 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Pantalla de Cocina (KDS)</h1>
          </div>
        </div>
        <div className="flex gap-4">
          <Badge className="bg-white/20 text-white border-none text-lg px-4 py-1">
            Activos: {tickets.length}
          </Badge>
          <div className="text-right">
            <div className="font-bold text-lg">Estación Principal</div>
            <div className="text-xs opacity-70">Sincronizado con Firestore</div>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground opacity-50">
            <ChefHat className="h-20 w-20 mb-4" />
            <p className="text-xl font-bold">¡Cocina despejada!</p>
            <p>No hay pedidos pendientes por ahora.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className={`overflow-hidden border-2 flex flex-col h-[400px] ${ticket.status === 'new' ? 'border-primary shadow-lg animate-pulse' : 'border-border'}`}>
                <CardHeader className={`${STATUS_CONFIG[ticket.status].color} py-3 px-4 flex-row justify-between items-center space-y-0`}>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {ticket.orderId}
                    </CardTitle>
                    <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Ticket: {ticket.id?.substring(0, 6)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" /> {getElapsedTime(ticket.timestamp)}
                    </div>
                    <div className="flex items-center gap-1 mt-1 font-bold">
                      {STATUS_CONFIG[ticket.status].icon}
                      <span className="text-xs">{STATUS_CONFIG[ticket.status].label}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-4 space-y-4">
                  <ul className="space-y-3">
                    {ticket.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-start border-b pb-2">
                        <div className="flex items-center gap-3">
                          <span className="bg-secondary text-primary font-black px-2 rounded-md text-lg">
                            {item.quantity}
                          </span>
                          <span className="font-bold text-lg">{item.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="p-4 bg-muted/30 grid grid-cols-1 gap-2 mt-auto">
                  {ticket.status === 'new' && (
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-white font-bold h-12 text-lg" 
                      onClick={() => updateTicketStatus(ticket.id!, 'preparing')}
                    >
                      Empezar a Cocinar
                    </Button>
                  )}
                  {ticket.status === 'preparing' && (
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg"
                      onClick={() => updateTicketStatus(ticket.id!, 'ready')}
                    >
                      Marcar como Listo
                    </Button>
                  )}
                  {ticket.status === 'ready' && (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-lg"
                      onClick={() => updateTicketStatus(ticket.id!, 'served')}
                    >
                      Marcar como Servido
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
