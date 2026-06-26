import { MenuItem } from './types';
import React from 'react';
import { Coffee, Cake, UtensilsCrossed } from 'lucide-react';

export const MENU_ITEMS: MenuItem[] = [
  // Beverages
  {
    id: 'b1',
    name: 'Cappuccino',
    description: 'Rich espresso with steamed milk foam',
    price: 149,
    category: 'Beverages',
    type: 'beverage',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'b2',
    name: 'Iced Latte',
    description: 'Chilled milk with espresso shot',
    price: 189,
    category: 'Beverages',
    type: 'beverage',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b5aa5023?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'b3',
    name: 'Mango Smoothie',
    description: 'Fresh mango blend with yogurt',
    price: 210,
    category: 'Beverages',
    type: 'beverage',
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=300&q=80'
  },
  
  // Cakes / Bakery
  {
    id: 'c1',
    name: 'Red Velvet Slice',
    description: 'Classic red velvet with cream cheese frosting',
    price: 250,
    category: 'Cakes',
    type: 'veg',
    image: 'https://images.unsplash.com/photo-1586788680434-30d32443d468?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'c2',
    name: 'Chocolate Lava',
    description: 'Molten chocolate center served hot',
    price: 199,
    category: 'Cakes',
    type: 'veg',
    image: 'https://images.unsplash.com/photo-1617305855058-29e28fa23223?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'c3',
    name: 'Blueberry Muffin',
    description: 'Freshly baked muffin with organic blueberries',
    price: 120,
    category: 'Cakes',
    type: 'veg',
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=300&q=80'
  },

  // Main Course / Snacks
  {
    id: 'm1',
    name: 'Aloo Paratha',
    description: 'Stuffed potato flatbread with curd & pickle',
    price: 150,
    category: 'Main Course',
    type: 'veg',
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'm2',
    name: 'Grilled Sandwich',
    description: 'Cheese and veggies grilled to perfection',
    price: 180,
    category: 'Main Course',
    type: 'veg',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'm3',
    name: 'Veggie Pizza',
    description: 'Thin crust with peppers, onions, and mushrooms',
    price: 350,
    category: 'Main Course',
    type: 'veg',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80'
  }
];

export const CATEGORIES = [
  { id: 'Beverages', label: 'Beverages', icon: <Coffee size={18} /> },
  { id: 'Cakes', label: 'Bakery', icon: <Cake size={18} /> },
  { id: 'Main Course', label: 'Food', icon: <UtensilsCrossed size={18} /> },
];