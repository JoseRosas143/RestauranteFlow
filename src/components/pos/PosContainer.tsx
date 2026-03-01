"use client"

import React, { useState } from 'react';
import { MenuItem, Order, Payment } from '@/lib/types';
import { INITIAL_MENU } from '@/lib/mock-data';
import { Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle2, X, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';

const TAX_RATE = 0.08;

export default function PosContainer() {
  const [activeOrder, setActiveOrder] = useState<Order>(createEmptyOrder());
  const [menu] = useState<MenuItem[]>(INITIAL_MENU);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState<string>('');
  
  function createEmptyOrder(): Order {
    return {
      id: `PED-${Math.floor(Math.random() * 90000) + 10000}`,
      status: 'draft',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      payments: [],
      paidAmount: 0,
      createdAt: Date.now(),
    };
  }

  const addToCart = (item: MenuItem) => {
    if (activeOrder.status !== 'draft') {
      toast({ title: 'Pedido Bloqueado', description: 'Los pedidos confirmados no pueden modificarse.' });
      return;
    }

    setActiveOrder(prev => {
      const existing = prev.items.find(i => i.menuItemId === item.id);
      let newItems;
      if (existing) {
        newItems = prev.items.map(i => 
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        newItems = [...prev.items, {
          id: `OI-${Date.now()}`,
          menuItemId: item.id,
          name: item.name,
          quantity: 1,
          priceAtOrder: item.price
        }];
      }
      return updateOrderTotals({ ...prev, items: newItems });
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    if (activeOrder.status !== 'draft') return;
    setActiveOrder(prev => {
      const newItems = prev.items.map(i => {
        if (i.id === itemId) {
          const newQty = Math.max(0, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      }).filter(i => i.quantity > 0);
      return updateOrderTotals({ ...prev, items: newItems });
    });
  };

  const updateOrderTotals = (order: Order): Order => {
    const subtotal = order.items.reduce((acc, item) => acc + (item.priceAtOrder * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { ...order, subtotal, tax, total };
  };

  const confirmOrder = () => {
    if (activeOrder.items.length === 0) {
      toast({ title: 'Carrito Vacío', description: 'Añade productos antes de confirmar.' });
      return;
    }
    setActiveOrder(prev => ({ ...prev, status: 'confirmed' }));
    toast({ title: 'Pedido Confirmado', description: 'Enviado al sistema de cocina.' });
  };

  const handlePayment = (method: 'cash' | 'card' | 'transfer') => {
    const amountToPay = parseFloat(partialAmount) || (activeOrder.total - activeOrder.paidAmount);
    
    if (amountToPay <= 0 || isNaN(amountToPay)) {
      toast({ title: 'Monto Inválido', description: 'Por favor, introduce un monto válido.' });
      return;
    }

    if (amountToPay > (activeOrder.total - activeOrder.paidAmount) + 0.01) {
      toast({ title: 'Pago Excedido', description: 'El monto excede el total pendiente.' });
      return;
    }

    const newPayment: Payment = {
      id: `PAG-${Date.now()}`,
      amount: amountToPay,
      method,
      timestamp: Date.now()
    };

    const newPaidAmount = activeOrder.paidAmount + amountToPay;
    const isFullyPaid = newPaidAmount >= activeOrder.total - 0.01;

    setActiveOrder(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment],
      paidAmount: newPaidAmount,
      status: isFullyPaid ? 'paid' : prev.status
    }));

    setPartialAmount('');
    if (isFullyPaid) {
      setPaymentDialogOpen(false);
      toast({ title: 'Pago Exitoso', description: 'Pedido pagado por completo y finalizado.' });
    } else {
      toast({ title: 'Pago Parcial', description: `$${amountToPay.toFixed(2)} registrado.` });
    }
  };

  const resetAll = () => {
    setActiveOrder(createEmptyOrder());
    setPaymentDialogOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Lado izquierdo: Selección de Menú */}
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-4 rounded-xl border">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" /> ChoripanFlow POS
          </h1>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1">Terminal #01</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">Cajero: Juan M.</Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {menu.map((item) => (
              <Card 
                key={item.id} 
                className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden border-2 border-transparent active:border-primary"
                onClick={() => addToCart(item)}
              >
                <div className="relative h-32 w-full overflow-hidden">
                  {item.image ? (
                    <Image 
                      src={item.image} 
                      alt={item.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary/90 text-white font-bold border-none shadow-md">
                      ${item.price.toFixed(2)}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="p-3">
                  <CardTitle className="text-base truncate">{item.name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Lado derecho: Carrito y Acciones */}
      <div className="w-96 bg-white border-l shadow-2xl flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
          <div>
            <h2 className="font-bold text-lg">{activeOrder.id}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={activeOrder.status === 'draft' ? 'secondary' : activeOrder.status === 'confirmed' ? 'default' : 'outline'}>
                {activeOrder.status === 'draft' ? 'BORRADOR' : activeOrder.status === 'confirmed' ? 'CONFIRMADO' : 'PAGADO'}
              </Badge>
              {activeOrder.status === 'paid' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={resetAll} title="Nuevo Pedido">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {activeOrder.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 pt-20">
              <ShoppingCart className="h-16 w-16 mb-4" />
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center group">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold truncate text-sm">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">${item.priceAtOrder.toFixed(2)} / ud</p>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-md"
                      disabled={activeOrder.status !== 'draft'}
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                    </Button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-md"
                      disabled={activeOrder.status !== 'draft'}
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="w-20 text-right font-semibold text-sm">
                    ${(item.priceAtOrder * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-6 bg-muted/30 space-y-3 border-t">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${activeOrder.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Impuestos ({(TAX_RATE * 100).toFixed(0)}%)</span>
            <span>${activeOrder.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-border/50">
            <span>Total</span>
            <span className="text-primary">${activeOrder.total.toFixed(2)}</span>
          </div>
          {activeOrder.paidAmount > 0 && (
            <div className="flex justify-between text-sm font-semibold text-green-600">
              <span>Pagado</span>
              <span>-${activeOrder.paidAmount.toFixed(2)}</span>
            </div>
          )}
          {activeOrder.total > activeOrder.paidAmount && activeOrder.paidAmount > 0 && (
            <div className="flex justify-between text-base font-bold text-accent">
              <span>Saldo Pendiente</span>
              <span>${(activeOrder.total - activeOrder.paidAmount).toFixed(2)}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 pt-4">
            {activeOrder.status === 'draft' ? (
              <Button size="lg" className="w-full h-14 text-lg font-bold" onClick={confirmOrder}>
                Confirmar Pedido
              </Button>
            ) : activeOrder.status === 'confirmed' ? (
              <Button size="lg" variant="default" className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/90" onClick={() => setPaymentDialogOpen(true)}>
                Cobrar Pago
              </Button>
            ) : (
              <Button size="lg" variant="outline" className="w-full h-14 text-lg font-bold" onClick={resetAll}>
                Siguiente Cliente
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo de Pago */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Pedido {activeOrder.id} - Total Pendiente: ${(activeOrder.total - activeOrder.paidAmount).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto Parcial (Vacio para balance total)</label>
              <Input 
                placeholder="Ingresar monto..." 
                type="number" 
                value={partialAmount} 
                onChange={(e) => setPartialAmount(e.target.value)}
                className="text-lg h-12"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="flex flex-col h-20 gap-2" onClick={() => handlePayment('cash')}>
                <Banknote className="h-6 w-6" />
                <span>Efectivo</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-20 gap-2" onClick={() => handlePayment('card')}>
                <CreditCard className="h-6 w-6" />
                <span>Tarjeta</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-20 gap-2" onClick={() => handlePayment('transfer')}>
                <CheckCircle2 className="h-6 w-6" />
                <span>Transferencia</span>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
