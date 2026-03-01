
import Link from 'next/link';
import { ShoppingCart, Utensils, BarChart3, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const modules = [
    {
      title: 'POS Terminal',
      description: 'Manage sales, orders, and payments.',
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      href: '/pos',
      color: 'bg-primary/10',
    },
    {
      title: 'Kitchen Display (KDS)',
      description: 'Monitor tickets and track food preparation.',
      icon: <Utensils className="h-8 w-8 text-accent" />,
      href: '/kds',
      color: 'bg-accent/10',
    },
    {
      title: 'Admin Dashboard',
      description: 'Review sales analytics and business growth.',
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      href: '/admin',
      color: 'bg-blue-50',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-primary">ChoripanFlow</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Crafting the perfect flow for your artisanal kitchen. Efficient ordering, real-time kitchen tracking, and deep insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {modules.map((module) => (
          <Link key={module.href} href={module.href} className="group">
            <Card className="h-full border-2 border-transparent transition-all group-hover:border-primary group-hover:shadow-xl group-hover:-translate-y-1 overflow-hidden">
              <div className={`h-2 w-full ${module.title === 'POS Terminal' ? 'bg-primary' : module.title === 'Kitchen Display (KDS)' ? 'bg-accent' : 'bg-blue-600'}`} />
              <CardHeader>
                <div className={`p-3 rounded-xl w-fit mb-4 ${module.color}`}>
                  {module.icon}
                </div>
                <CardTitle className="text-2xl">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  Enter Module <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <footer className="text-muted-foreground text-sm opacity-60">
        &copy; {new Date().getFullYear()} ChoripanFlow. Built for excellence in service.
      </footer>
    </div>
  );
}
