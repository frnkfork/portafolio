import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MenuData, MenuItem } from '../types/menu';

/**
 * Real-time Supabase listener for the 'menu' table.
 */
export const useSupabaseListener = () => {
    const [items, setItems] = useState<MenuData>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInitialData = async () => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }
        const { data, error } = await supabase
            .from('menu')
            .select('*')
            .order('category', { ascending: true });

        if (error) {
            setError(error.message);
        } else {
            setItems(data as MenuData);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const client = supabase;
        if (!client) return;

        fetchInitialData();

        const channel = client
            .channel('menu-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'menu'
                },
                (payload) => {
                    console.log('[Supabase] Realtime event:', payload);

                    if (payload.eventType === 'INSERT') {
                        setItems(prev => [...prev, payload.new as MenuItem]);
                    } else if (payload.eventType === 'UPDATE') {
                        setItems(prev => prev.map(item =>
                            item.id === payload.new.id ? (payload.new as MenuItem) : item
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        setItems(prev => prev.filter(item => item.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            if (channel) client.removeChannel(channel);
        };
    }, []);

    return { items, isLoading, error };
};
