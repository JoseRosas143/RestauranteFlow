
import { MenuItem } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Choripán Clásico',
    price: 12.50,
    category: 'Sándwiches',
    image: PlaceHolderImages.find(img => img.id === 'classic-choripan')?.imageUrl || '',
  },
  {
    id: '2',
    name: 'Choripán Provoleta',
    price: 15.00,
    category: 'Sándwiches',
    image: PlaceHolderImages.find(img => img.id === 'cheese-choripan')?.imageUrl || '',
  },
  {
    id: '3',
    name: 'Empanada de Carne',
    price: 4.50,
    category: 'Entradas',
    image: PlaceHolderImages.find(img => img.id === 'empanada-beef')?.imageUrl || '',
  },
  {
    id: '4',
    name: 'Papas Rústicas',
    price: 6.00,
    category: 'Acompañamientos',
    image: PlaceHolderImages.find(img => img.id === 'fries')?.imageUrl || '',
  },
  {
    id: '5',
    name: 'Malbec Reserva',
    price: 9.00,
    category: 'Bebidas',
    image: PlaceHolderImages.find(img => img.id === 'malbec-wine')?.imageUrl || '',
  },
  {
    id: '6',
    name: 'Cerveza Quilmes',
    price: 7.50,
    category: 'Bebidas',
    image: PlaceHolderImages.find(img => img.id === 'quilmes-beer')?.imageUrl || '',
  },
];
