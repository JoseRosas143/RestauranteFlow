
import { MenuItem } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const INITIAL_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Choripán',
    price: 12.50,
    category: 'Sandwiches',
    image: PlaceHolderImages.find(img => img.id === 'classic-choripan')?.imageUrl || '',
  },
  {
    id: '2',
    name: 'Provoleta Choripán',
    price: 15.00,
    category: 'Sandwiches',
    image: PlaceHolderImages.find(img => img.id === 'cheese-choripan')?.imageUrl || '',
  },
  {
    id: '3',
    name: 'Beef Empanada',
    price: 4.50,
    category: 'Starters',
    image: PlaceHolderImages.find(img => img.id === 'empanada-beef')?.imageUrl || '',
  },
  {
    id: '4',
    name: 'Rustic Fries',
    price: 6.00,
    category: 'Sides',
    image: PlaceHolderImages.find(img => img.id === 'fries')?.imageUrl || '',
  },
  {
    id: '5',
    name: 'Malbec Reserva',
    price: 9.00,
    category: 'Drinks',
    image: PlaceHolderImages.find(img => img.id === 'malbec-wine')?.imageUrl || '',
  },
  {
    id: '6',
    name: 'Quilmes Draft',
    price: 7.50,
    category: 'Drinks',
    image: PlaceHolderImages.find(img => img.id === 'quilmes-beer')?.imageUrl || '',
  },
];
