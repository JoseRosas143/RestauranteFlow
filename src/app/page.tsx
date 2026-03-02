import Link from 'next/link';
import { ShoppingCart, Utensils, BarChart3, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const modules = [
    {
      title: 'Terminal POS',
      description: 'Gestiona ventas, pedidos y pagos.',
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      href: '/pos',
      color: 'bg-primary/10',
    },
    {
      title: 'Pantalla de Cocina (KDS)',
      description: 'Monitorea tickets y sigue la preparación.',
      icon: <Utensils className="h-8 w-8 text-accent" />,
      href: '/kds',
      color: 'bg-accent/10',
    },
    {
      title: 'Panel de Administración',
      description: 'Revisa métricas de ventas y configuración.',
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      href: '/admin',
      color: 'bg-blue-50',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-primary">RestauranteFlow</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          El flujo perfecto para tu negocio gastronómico. Pedidos eficientes, multi-sucursal y análisis profundo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {modules.map((module) => (
          <Link key={module.href} href={module.href} className="group">
            <Card className="h-full border-2 border-transparent transition-all group-hover:border-primary group-hover:shadow-xl group-hover:-translate-y-1 overflow-hidden">
              <div className={`h-2 w-full ${module.title === 'Terminal POS' ? 'bg-primary' : module.title === 'Pantalla de Cocina (KDS)' ? 'bg-accent' : 'bg-blue-600'}`} />
              <CardHeader>
                <div className={`p-3 rounded-xl w-fit mb-4 ${module.color}`}>
                  {module.icon}
                </div>
                <CardTitle className="text-2xl">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  Entrar al Módulo <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <footer className="text-muted-foreground text-sm opacity-60">
        &copy; {new Date().getFullYear()} RestauranteFlow. Diseñado para la excelencia en el servicio.
      </footer>
    </div>
  );
}
