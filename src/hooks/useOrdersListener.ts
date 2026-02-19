import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Order } from '../types/menu';

export const useOrdersListener = (onNewOrder?: (order: Order) => void) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = async () => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setOrders(data as Order[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const client = supabase;
        if (!client) return;

        console.log('[Orders] Subscribing to Realtime...');
        fetchOrders();

        // Create a unique channel name to avoid conflicts if multiple components use this hook
        const channelId = `orders-channel-${Math.random().toString(36).substr(2, 9)}`;
        const channel = client
            .channel(channelId)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    console.log('[Orders] Realtime change received:', payload.eventType, payload);
                    if (payload.eventType === 'INSERT') {
                        const newOrder = payload.new as Order;
                        setOrders(prev => [newOrder, ...prev]);
                        if (onNewOrder) onNewOrder(newOrder);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedOrder = payload.new as Order;
                        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.id;
                        setOrders(prev => prev.filter(o => o.id !== deletedId));
                    }
                }
            )
            .subscribe((status) => {
                console.log(`[Orders] Subscription status for ${channelId}:`, status);
                if (status === 'CHANNEL_ERROR') {
                    console.error('[Orders] Error subscribing to Realtime. Is "Realtime" enabled for the "orders" table?');
                }
            });

        return () => {
            console.log(`[Orders] Unsubscribing from ${channelId}`);
            if (channel) client.removeChannel(channel);
        };
    }, []); // Only run once on mount or when onNewOrder changes if needed

    return { orders, isLoading };
};
