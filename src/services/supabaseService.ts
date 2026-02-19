import { supabase } from '../lib/supabaseClient';
import type { MenuItem, MenuData, Order } from '../types/menu';

/**
 * Fetch the full menu from Supabase.
 */
export const loadMenuFromSupabase = async (): Promise<MenuData | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('menu')
        .select('*')
        .order('category', { ascending: true });

    if (error) {
        console.error('[Supabase] Error loading menu:', error);
        return null;
    }

    return data as MenuData;
};

/**
 * Partially update a single menu item.
 */
export const updateMenuItem = async (
    itemId: number,
    changes: Partial<MenuItem>
): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase
        .from('menu')
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq('id', itemId);

    if (error) {
        console.error('[Supabase] Error updating item:', error);
        throw error;
    }
};

/**
 * Upsert the entire menu to Supabase.
 * Used for ADD_ITEM or RESET_MENU logic if handled globally.
 */
export const syncFullMenu = async (items: MenuData): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase
        .from('menu')
        .upsert(
            items.map(item => ({
                ...item,
                updated_at: new Date().toISOString()
            }))
        );

    if (error) {
        console.error('[Supabase] Error syncing full menu:', error);
        throw error;
    }
};


/**
 * Cleanly resets the database menu by deleting all items and re-seeding.
 */
export const resetMenuInSupabase = async (defaults: MenuData): Promise<void> => {
    if (!supabase) return;

    // 1. Delete all existing items
    const { error: deleteError } = await supabase
        .from('menu')
        .delete()
        .neq('id', -1); // Deletes all since IDs are positive

    if (deleteError) {
        console.error('[Supabase] Error clearing menu:', deleteError);
        throw deleteError;
    }

    // 2. Re-insert initial data
    await syncFullMenu(defaults);
};

/**
 * Helper to toggle availability by fuzzy name search.
 */
export const supabaseToggleAvailability = async (
    items: MenuData,
    nameFragment: string
): Promise<void> => {
    const normalised = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const target = normalised(nameFragment);
    const item = items.find(i => {
        const n = normalised(i.name);
        return n.includes(target) || target.includes(n);
    });

    if (!item) return;
    await updateMenuItem(item.id, { available: !item.available });
};

/**
 * Helper to update price by fuzzy name search.
 */
export const supabaseUpdatePrice = async (
    items: MenuData,
    nameFragment: string,
    newPrice: number
): Promise<void> => {
    const item = items.find(i =>
        i.name.toLowerCase().includes(nameFragment.toLowerCase())
    );
    if (!item) return;
    await updateMenuItem(item.id, { price: newPrice });
};

/**
 * Create a new order in Supabase.
 */
export const createOrder = async (order: Order): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase
        .from('orders')
        .insert([{
            ...order,
            created_at: new Date().toISOString()
        }]);

    if (error) {
        console.error('[Supabase] Error creating order:', error);
        throw error;
    }
};

/**
 * Update the status of an existing order.
 */
export const updateOrderStatus = async (
    orderId: string,
    newStatus: Order['status']
): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) {
        console.error('[Supabase] Error updating order status:', error);
        throw error;
    }
};

/**
 * Delete an order from the database.
 */
export const deleteOrder = async (orderId: string): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

    if (error) {
        console.error('[Supabase] Error deleting order:', error);
        throw error;
    }
};
