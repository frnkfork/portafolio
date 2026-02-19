export const CURRENCY = 'S/';

export interface MenuItem {
    id: number;
    name: string;
    category: 'Entradas' | 'Fondos' | 'Bebidas' | 'Postres';
    price: number;
    description: string;
    image: string;
    available: boolean;
}

export type MenuData = MenuItem[];

export interface OrderItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

export interface Order {
    id?: string;
    table_number: string;
    items: OrderItem[];
    total: number;
    status: 'pending' | 'preparing' | 'delivered' | 'cancelled';
    created_at?: string;
}

export const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop';
