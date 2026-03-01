"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Users, ArrowUpRight, ArrowDownRight, Database, Loader2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { INITIAL_MENU } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

const SALES_DATA = [
  { name: 'Lun', sales: 4200 },
  { name: 'Mar', sales: 3800 },
  { name: 'Mié', sales: 5100 },
  { name: 'Jue', sales: 4900 },
  { name: 'Vie', sales: 6800 },
  { name: 'Sáb', sales: 8200 },
  { name: 'Dom', sales: 7100 },
];

const TOP_ITEMS = [
  { name: 'Choripán Clásico', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Choripán Provoleta', value: 25, color: 'hsl(var(--accent))' },
  { name: 'Empanadas', value: 15, color: '#F59E0B' },
  { name: 'Papas Rústicas', value: 10, color: '#3B82F6' },
  { name: 'Otros', value: 5, color: '#9CA3AF' },
];

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    // Generar datos aleatorios de transacciones solo en el cliente para evitar errores de hidratación
    const transactions = [1, 2, 3, 4, 5].map((i) => ({
      id: `PED-209${i}`,
      time: `Hoy a las ${10 + i}:${20 + i * 5} AM`,
      amount: (Math.random() * 50 + 20).toFixed(2),
    }));
    setRecentTransactions(transactions);
  }, []);

  const seedMenu = async () => {
    setIsSeeding(true);
    try {
      // Verificar si ya hay items para no duplicar
      const menuRef = collection(db, 'menu');
      const q = query(menuRef, limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        toast({
          title: "Menú ya inicializado",
          description: "Ya existen productos en la base de datos.",
        });
        setIsSeeding(false);
        return;
      }

      // Cargar items de INITIAL_MENU
      const promises = INITIAL_MENU.map(item => {
        // Quitamos el ID fijo para que Firestore genere uno nuevo o usamos el mismo
        const { id, ...itemData } = item;
        return addDoc(collection(db, 'menu'), itemData);
      });

      await Promise.all(promises);
      
      toast({
        title: "¡Éxito!",
        description: "El menú inicial ha sido cargado en Firestore.",
      });
    } catch (error) {
      console.error("Error al cargar menú:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el menú inicial.",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-white border-b px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Métricas del Negocio</h1>
          <p className="text-muted-foreground">Rendimiento en tiempo real para ChoripanFlow.</p>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={seedMenu}
            disabled={isSeeding}
          >
            {isSeeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Cargar Menú Inicial
          </Button>
          <div className="bg-secondary/50 rounded-lg p-2 px-4 flex items-center gap-3">
            <span className="text-sm font-medium">Periodo del Informe:</span>
            <Badge className="bg-primary text-white">Esta Semana</Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Ingresos Totales" value="$40,100" change="+12.5%" icon={<DollarSign />} positive />
          <StatCard title="Pedidos Realizados" value="1,248" change="+8.2%" icon={<ShoppingBag />} positive />
          <StatCard title="Ticket Promedio" value="$32.15" change="-1.4%" icon={<TrendingUp />} positive={false} />
          <StatCard title="Total Clientes" value="842" change="+18.3%" icon={<Users />} positive />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Pronóstico de Ingresos</CardTitle>
              <CardDescription>Rendimiento diario comparado con la semana anterior.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SALES_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
              <CardDescription>Contribución por categoría a los ingresos totales.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={TOP_ITEMS}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {TOP_ITEMS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4 w-1/2 pr-8">
                {TOP_ITEMS.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>Últimos 5 pedidos en todos los terminales.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-full text-primary">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold">{tx.id}</div>
                        <div className="text-xs text-muted-foreground">{tx.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 font-bold px-3">PAGADO</Badge>
                      <div className="font-bold text-lg">${tx.amount}</div>
                    </div>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ title, value, change, icon, positive }: { title: string, value: string, change: string, icon: React.ReactNode, positive: boolean }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary opacity-60">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-xs mt-1 ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {positive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
          {change} desde el mes pasado
        </div>
      </CardContent>
    </Card>
  );
}
