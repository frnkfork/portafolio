import type { MenuItem, MenuData } from '../types/menu';
import { initialMenu } from './initialMenu';

export type Action =
    | { type: 'UPDATE_PRICE'; payload: { id: number; price: number } }
    | { type: 'UPDATE_PRICE_BY_NAME'; payload: { name: string; price: number } }
    | { type: 'ADJUST_PRICE_BY_CATEGORY'; payload: { category: string; amount: number } }
    | { type: 'BULK_CATEGORY_DISCOUNT'; payload: { category: string; percentage: number } }
    | { type: 'TOGGLE_AVAILABILITY'; payload: { name: string } }
    | { type: 'RESET_MENU' }
    | { type: 'SET_MENU'; payload: MenuData }
    | { type: 'ADD_ITEM'; payload: Omit<MenuItem, 'id'> };

export const menuReducer = (state: MenuData, action: Action): MenuData => {
    switch (action.type) {
        case 'UPDATE_PRICE':
            return state.map((item) =>
                item.id === action.payload.id ? { ...item, price: action.payload.price } : item
            );

        case 'UPDATE_PRICE_BY_NAME': {
            const { name, price } = action.payload;
            const normalizedTargetName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            return state.map((item) => {
                const normalizedItemName = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                // Fuzzy match
                if (normalizedItemName.includes(normalizedTargetName) || normalizedTargetName.includes(normalizedItemName)) {
                    return { ...item, price };
                }
                return item;
            });
        }

        case 'ADJUST_PRICE_BY_CATEGORY': {
            const { category, amount } = action.payload;
            const normalizedTargetCat = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            return state.map((item) => {
                const normalizedItemCat = item.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (normalizedItemCat.includes(normalizedTargetCat) || normalizedTargetCat.includes(normalizedItemCat)) {
                    // Ensure price doesn't go below 0
                    return { ...item, price: Math.max(0, item.price + amount) };
                }
                return item;
            });
        }

        case 'BULK_CATEGORY_DISCOUNT': {
            const { category, percentage } = action.payload;
            const normalizedTargetCat = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            return state.map((item) => {
                const normalizedItemCat = item.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (normalizedItemCat.includes(normalizedTargetCat) || normalizedTargetCat.includes(normalizedItemCat)) {
                    const discountFactor = 1 - (percentage / 100);
                    return { ...item, price: Number((item.price * discountFactor).toFixed(2)) };
                }
                return item;
            });
        }

        case 'ADD_ITEM': {
            const newItem: MenuItem = {
                id: Date.now(),
                ...action.payload,
                available: action.payload.available ?? true,
                image: action.payload.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
            };
            return [...state, newItem];
        }

        case 'TOGGLE_AVAILABILITY': {
            const normalizedTarget = action.payload.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return state.map((item) => {
                const normalizedItem = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (normalizedItem.includes(normalizedTarget) || normalizedTarget.includes(normalizedItem)) {
                    return { ...item, available: !item.available };
                }
                return item;
            });
        }

        case 'RESET_MENU':
            return [...initialMenu];

        case 'SET_MENU':
            return [...action.payload];

        default:
            return state;
    }
};
