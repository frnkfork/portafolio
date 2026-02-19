import { useState, useEffect } from 'react';
import type { MenuData, MenuItem, Order, OrderItem } from '../types/menu';
import { PLACEHOLDER_IMAGE } from '../types/menu';
import { AnimatedPrice } from './AnimatedPrice';
import { ShoppingCart, Send, Plus, X, User } from 'lucide-react';
import { createOrder } from '../services/supabaseService';
import { toast } from 'sonner';

interface MobilePreviewProps {
    items: MenuData;
}

const MobilePreview = ({ items }: MobilePreviewProps) => {
    const [cart, setCart] = useState<{ [key: number]: number }>({});
    const [tableNumber, setTableNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Detect table number from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mesa = params.get('mesa') || params.get('table');
        if (mesa) setTableNumber(mesa);
    }, []);

    const addToCart = (item: MenuItem) => {
        if (!item.available) return;
        setCart(prev => ({
            ...prev,
            [item.id]: (prev[item.id] || 0) + 1
        }));
        toast.success(`${item.name} añadido al carrito`, {
            duration: 1500,
            position: 'bottom-center'
        });
    };

    const removeFromCart = (id: number) => {
        setCart(prev => {
            const next = { ...prev };
            if (next[id] > 1) next[id]--;
            else delete next[id];
            return next;
        });
    };

    const cartTotalItems = Object.values(cart).reduce((a, b) => a + b, 0);
    const cartTotalPrice = Object.entries(cart).reduce((total, [id, qty]) => {
        const item = items.find(i => i.id === Number(id));
        return total + (item?.price || 0) * qty;
    }, 0);

    const handleSendOrder = async () => {
        if (!tableNumber) {
            const mesa = prompt('Por favor, ingresa tu número de mesa:');
            if (!mesa) return;
            setTableNumber(mesa);
            return;
        }

        if (cartTotalItems === 0) return;

        setIsSubmitting(true);
        try {
            const orderItems: OrderItem[] = Object.entries(cart).map(([id, qty]) => {
                const item = items.find(i => i.id === Number(id))!;
                return {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: qty
                };
            });

            const order: Order = {
                table_number: tableNumber,
                items: orderItems,
                total: cartTotalPrice,
                status: 'pending'
            };

            await createOrder(order);
            setCart({});
            setIsCartOpen(false);
            toast.success('¡Pedido enviado con éxito!', {
                description: 'La cocina ya está preparando tu orden.'
            });
        } catch (err: any) {
            console.error('[Order] Error detail:', err);
            const msg = err?.message || 'Error al enviar el pedido';
            toast.error('Error al enviar el pedido', {
                description: msg.includes('relation "orders" does not exist')
                    ? 'La tabla "orders" no existe en Supabase. Revisa el walkthrough.'
                    : msg
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-full p-8 bg-gray-100/50">
            {/* iPhone Frame */}
            <div className="relative w-[375px] h-[812px] bg-black rounded-[50px] shadow-2xl overflow-hidden border-8 border-gray-900 ring-4 ring-gray-200/50">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-b-2xl z-30 flex justify-center items-end pb-1 shadow-inner">
                    <div className="w-16 h-1 bg-gray-800 rounded-full"></div>
                </div>

                {/* Screen Content */}
                <div className="w-full h-full bg-white overflow-y-auto no-scrollbar pt-12 text-gray-800 flex flex-col relative">
                    <header className="px-6 pb-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-20">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-gray-900">Digital Menu</h2>
                            {tableNumber && (
                                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-0.5">Mesa {tableNumber}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Live sync indicator */}
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                Live
                            </span>
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <User className="w-4 h-4" />
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto pt-4 pb-24">
                        <div className="p-4 space-y-8">
                            {['Entradas', 'Fondos', 'Postres', 'Bebidas'].map((category) => {
                                const categoryItems = items.filter(i => i.category === category);
                                if (categoryItems.length === 0) return null;

                                return (
                                    <div key={category} className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] pl-1">{category}</h3>
                                        <div className="space-y-4">
                                            {categoryItems.map((item) => {
                                                const isUnavailable = !item.available;
                                                const qty = cart[item.id] || 0;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`relative bg-white border rounded-3xl p-3 shadow-sm flex gap-4 items-center transition-all duration-300 ${isUnavailable
                                                            ? 'border-red-50/50 opacity-60 bg-gray-50'
                                                            : 'border-gray-100 hover:shadow-md active:scale-[0.98]'
                                                            }`}
                                                    >
                                                        {/* Image */}
                                                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 shadow-inner">
                                                            <img
                                                                src={item.image || PLACEHOLDER_IMAGE}
                                                                alt={item.name}
                                                                className={`w-full h-full object-cover transition-all duration-500 ${isUnavailable ? 'grayscale' : ''}`}
                                                                onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMAGE)}
                                                            />
                                                        </div>

                                                        <div className="flex-1 min-w-0 pr-1">
                                                            <h4 className="font-bold text-gray-900 text-[15px] truncate">{item.name}</h4>
                                                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">{item.description}</p>
                                                            <div className="mt-3 flex items-center justify-between">
                                                                <span className={`font-black text-[15px] ${isUnavailable ? 'text-gray-400' : 'text-indigo-600'}`}>
                                                                    <AnimatedPrice price={item.price} />
                                                                </span>

                                                                {isUnavailable ? (
                                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black bg-red-50 text-red-500 border border-red-100">
                                                                        AGOTADO
                                                                    </span>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        {qty > 0 && (
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                                                                className="w-7 h-7 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold hover:bg-gray-200 transition-colors"
                                                                            >
                                                                                -
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => addToCart(item)}
                                                                            className={`h-7 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 shadow-sm ${qty > 0 ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-white hover:bg-black'
                                                                                }`}
                                                                        >
                                                                            {qty > 0 && <span className="text-[11px] font-black">{qty}</span>}
                                                                            <Plus className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Floating Cart Button */}
                    {cartTotalItems > 0 && (
                        <div className="absolute bottom-10 left-0 right-0 px-6 z-30 pointer-events-none">
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="w-full bg-indigo-600 text-white h-14 rounded-2xl shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] flex items-center justify-between px-6 pointer-events-auto active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <ShoppingCart className="w-5 h-5" />
                                        <span className="absolute -top-2 -right-2 bg-white text-indigo-600 text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-indigo-600">
                                            {cartTotalItems}
                                        </span>
                                    </div>
                                    <span className="font-bold text-sm">Ver mi pedido</span>
                                </div>
                                <span className="font-black text-sm">S/ {cartTotalPrice.toFixed(2)}</span>
                            </button>
                        </div>
                    )}

                    {/* Cart Modal Overlay */}
                    {isCartOpen && (
                        <div className="absolute inset-0 z-40 flex flex-col bg-black/60 backdrop-blur-md transition-all duration-300">
                            <div className="flex-1" onClick={() => setIsCartOpen(false)} />
                            <div className="bg-white rounded-t-[40px] px-8 pt-8 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black text-gray-900">Tu Pedido</h3>
                                    <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="max-h-[350px] overflow-y-auto pr-2 mb-8 space-y-4">
                                    {Object.entries(cart).map(([id, qty]) => {
                                        const item = items.find(i => i.id === Number(id))!;
                                        return (
                                            <div key={id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                                                        {qty}x
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium tracking-tight">Elegido con amor</p>
                                                    </div>
                                                </div>
                                                <span className="font-black text-sm text-gray-900">S/ {(item.price * qty).toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="border-t border-gray-100 pt-6 mb-8">
                                    <div className="flex justify-between items-center text-lg font-black">
                                        <span className="text-gray-400">Total</span>
                                        <span className="text-indigo-600">S/ {cartTotalPrice.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSendOrder}
                                    disabled={isSubmitting}
                                    className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all shadow-xl active:scale-95 ${isSubmitting ? 'bg-gray-200 text-gray-400' : 'bg-black text-white hover:bg-gray-900 shadow-indigo-100'
                                        }`}
                                >
                                    {isSubmitting ? 'PROCESANDO...' : 'ENVIAR PEDIDO'}
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-900 rounded-full z-40"></div>
            </div>
        </div>
    );
};

export default MobilePreview;
