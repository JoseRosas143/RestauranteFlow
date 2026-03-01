
import { MenuItem } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const INITIAL_MENU: MenuItem[] = [
  {
    name: 'Choripán Clásico',
    price: 12.50,
    cost: 4.00,
    category: 'Sándwiches',
    image: PlaceHolderImages.find(img => img.id === 'classic-choripan')?.imageUrl || '',
    soldBy: 'unidad',
    trackInventory: true,
    inventoryCount: 50,
    reference: 'CH-CLA-01',
    tpvColor: '#B8732E',
    tpvShape: 'cuadrado'
  },
  {
    name: 'Choripán Provoleta',
    price: 15.00,
    cost: 5.50,
    category: 'Sándwiches',
    image: PlaceHolderImages.find(img => img.id === 'cheese-choripan')?.imageUrl || '',
    soldBy: 'unidad',
    trackInventory: true,
    inventoryCount: 30,
    reference: 'CH-PRO-02',
    tpvColor: '#DD3C3C',
    tpvShape: 'circulo'
  },
  {
    name: 'Empanada de Carne',
    price: 4.50,
    cost: 1.50,
    category: 'Entradas',
    image: PlaceHolderImages.find(img => img.id === 'empanada-beef')?.imageUrl || '',
    soldBy: 'unidad',
    trackInventory: true,
    inventoryCount: 100,
    reference: 'EMP-CAR-01',
    tpvColor: '#F59E0B',
    tpvShape: 'hexágono'
  },
  {
    name: 'Papas Rústicas',
    price: 6.00,
    cost: 2.00,
    category: 'Acompañamientos',
    image: PlaceHolderImages.find(img => img.id === 'fries')?.imageUrl || '',
    soldBy: 'unidad',
    trackInventory: false,
    reference: 'ACO-PAP-01',
    tpvColor: '#10B981',
    tpvShape: 'cuadrado'
  },
  {
    name: 'Malbec Reserva',
    price: 9.00,
    cost: 4.50,
    category: 'Bebidas',
    image: PlaceHolderImages.find(img => img.id === 'malbec-wine')?.imageUrl || '',
    soldBy: 'unidad',
    trackInventory: true,
    inventoryCount: 24,
    reference: 'BEB-VIN-01',
    tpvColor: '#7C3AED',
    tpvShape: 'circulo'
  }
];
