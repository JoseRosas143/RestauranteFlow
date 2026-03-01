
"use client"

import React, { useState } from 'react';
import { KitchenTicket, TicketStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, Flame, ChefHat, Bell } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

const STATUS_CONFIG = {
  new: { label: 'Nuevo', color: 'bg-blue-100 text-blue-800', icon: <Bell className="h-4 w-4" /> },
  preparing: { label: 'En Preparación', color: 'bg-orange-100 text-orange-800', icon: <Flame className="h-4 w-4" /> },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  served: { label: 'Servido', color: 'bg-gray-100 text-gray-800', icon: <ChefHat className="h-4 w-4" /> },
};

const INITIAL_TICKETS: KitchenTicket[] = [
  {
    id: 'TK-1201',
    orderId: 'PED-54321',
    status: 'new',
    items: [
      { name: 'Choripán Clásico', quantity: 2 },
      { name: 'Papas Rústicas', quantity: 1 }
    ],
    timestamp: Date.now() - 1000 * 60 * 5 // hace 5 mins
  },
  {
    id: 'TK-1202',
    orderId: 'PED-54322',
    status: 'preparing',
    items: [
      { name: 'Choripán Provoleta', quantity: 1 },
      { name: 'Empanada de Carne', quantity: 3 }
    ],
    timestamp: Date.now() - 1000 * 60 * 12 // hace 12 mins
  }
];

export default function KdsContainer() {
  const [tickets, setTickets] = useState<KitchenTicket[]>(INITIAL_TICKETS);

  const updateTicketStatus = (ticketId: string, nextStatus: TicketStatus) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: nextStatus } : t
    ));
    toast({ title: 'Estado Actualizado', description: `El ticket ${ticketId} ahora está ${STATUS_CONFIG[nextStatus].label}.` });
  };

  const getElapsedTime = (timestamp: number) => {
    const mins = Math.floor((Date.now() - timestamp) / 60000);
    return `hace ${mins}m`;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-primary p-4 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Sistema de Pantalla de Cocina (KDS)</h1>
        </div>
        <div className="flex gap-4">
          <Badge className="bg-white/20 text-white border-none text-lg px-4 py-1">
            Activos: {tickets.filter(t => t.status !== 'served').length}
          </Badge>
          <div className="text-right">
            <div className="font-bold text-lg">Turno: Almuerzo</div>
            <div className="text-xs opacity-70">Estación de Cocina 01</div>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className={`overflow-hidden border-2 flex flex-col h-[400px] ${ticket.status === 'new' ? 'border-primary shadow-lg animate-pulse' : 'border-border'}`}>
              <CardHeader className={`${STATUS_CONFIG[ticket.status].color} py-3 px-4 flex-row justify-between items-center space-y-0`}>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {ticket.id}
                  </CardTitle>
                  <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">{ticket.orderId}</p>
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
              <CardFooter className="p-4 bg-muted/30 grid grid-cols-2 gap-2 mt-auto">
                {ticket.status === 'new' && (
                  <Button 
                    className="col-span-2 bg-primary hover:bg-primary/90 text-white font-bold h-12 text-lg" 
                    onClick={() => updateTicketStatus(ticket.id, 'preparing')}
                  >
                    Empezar a Cocinar
                  </Button>
                )}
                {ticket.status === 'preparing' && (
                  <Button 
                    className="col-span-2 bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg"
                    onClick={() => updateTicketStatus(ticket.id, 'ready')}
                  >
                    Marcar como Listo
                  </Button>
                )}
                {ticket.status === 'ready' && (
                  <Button 
                    className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-lg"
                    onClick={() => updateTicketStatus(ticket.id, 'served')}
                  >
                    Marcar como Servido
                  </Button>
                )}
                {ticket.status === 'served' && (
                  <Badge className="col-span-2 justify-center py-2 text-md">COMPLETADO</Badge>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
