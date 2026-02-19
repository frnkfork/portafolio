import React, { useState, useRef } from 'react';
import type { MenuItem } from '../types/menu';
import { Tag, Plus, X, Upload, CheckCircle, Trash2, QrCode, ChefHat, ShoppingBag, Clock, CheckCircle2, Coffee } from 'lucide-react';
import { CURRENCY, PLACEHOLDER_IMAGE, type Order } from '../types/menu';
import type { Action } from '../store/menuReducer';
import { toast } from 'sonner';
import { QRModal } from './QRModal';
import { useOrdersListener } from '../hooks/useOrdersListener';
import { updateOrderStatus, deleteOrder } from '../services/supabaseService';

type CategoryType = MenuItem['category'];

const CATEGORIES: CategoryType[] = ['Entradas', 'Fondos', 'Postres', 'Bebidas'];
const ORDER_AUTO_DELETE_MS = 30000;

interface MenuDashboardProps {
    items: MenuItem[];
    dispatch: React.Dispatch<Action>;
}

interface NewItemState {
    name: string;
    price: number;
    category: CategoryType;
    description: string;
    image: string;
}


const DEFAULT_ITEM: NewItemState = {
    name: '',
    price: 0,
    category: 'Entradas',
    description: '',
    image: ''
};

const MenuDashboard: React.FC<MenuDashboardProps> = ({ items, dispatch }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isQROpen, setIsQROpen] = useState(false);
    const [kitchenMode, setKitchenMode] = useState(false);
    const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
    const [newItem, setNewItem] = useState<NewItemState>(DEFAULT_ITEM);
    const [imageUploaded, setImageUploaded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { orders } = useOrdersListener();

    const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
        try {
            await updateOrderStatus(orderId, status);
            toast.success(`Pedido actualizado a ${status}`);

            // If marked as delivered, wait 30 seconds and then delete to keep DB clean
            if (status === 'delivered') {
                setTimeout(async () => {
                    try {
                        await deleteOrder(orderId);
                    } catch (err) {
                        console.error('[Order] Error in auto-deletion:', err);
                    }
                }, ORDER_AUTO_DELETE_MS);
            }
        } catch (err) {
            toast.error('Error al actualizar el estado del pedido');
        }
    };

    // Convert selected file to Base64 and store in state
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setNewItem(prev => ({ ...prev, image: base64 }));
            setImageUploaded(true);
            toast.success('Imagen cargada correctamente');
        };
        reader.readAsDataURL(file);
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name || !newItem.price) {
            toast.error("Por favor completa el nombre y el precio.");
            return;
        }

        dispatch({
            type: 'ADD_ITEM',
            payload: {
                name: newItem.name,
                price: Number(newItem.price),
                category: newItem.category,
                description: newItem.description,
                image: newItem.image,
                available: true
            }
        });

        toast.success(`¡${newItem.name} añadido a la carta!`);
        setIsModalOpen(false);
        setNewItem(DEFAULT_ITEM);
        setImageUploaded(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNewItem(DEFAULT_ITEM);
        setImageUploaded(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        {activeTab === 'menu' ? (kitchenMode ? '🍳 Gestión de Stock' : 'Panel de Control') : '📑 Pedidos en Vivo'}
                    </h2>
                    <p className="text-sm text-gray-400 font-medium mt-1">
                        {activeTab === 'menu'
                            ? `${items.length} platos en total · ${items.filter(i => !i.available).length} agotados`
                            : `${orders.filter(o => o.status === 'pending').length} pedidos pendientes`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Tab Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-xl mr-2">
                        <button
                            onClick={() => setActiveTab('menu')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'menu' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Menú
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pedidos
                            {orders.filter(o => o.status === 'pending').length > 0 && (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            )}
                        </button>
                    </div>

                    <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block" />

                    <button
                        onClick={() => setKitchenMode(!kitchenMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${kitchenMode ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'}`}
                    >
                        <ChefHat className="w-4 h-4" />
                        {kitchenMode ? 'Salir Modo Stock' : 'Modo Stock'}
                    </button>

                    {/* QR button */}
                    <button
                        onClick={() => setIsQROpen(true)}
                        className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-full shadow-sm hover:bg-indigo-50 transition-all hover:shadow-md active:scale-95"
                        title="Ver / Imprimir QR del menú"
                    >
                        <QrCode className="w-4 h-4" />
                        <span className="text-sm font-medium">Imprimir QR</span>
                    </button>

                    <button
                        onClick={() => setIsResetConfirmOpen(true)}
                        className="flex items-center gap-2 bg-white text-red-500 border border-red-200 px-4 py-2.5 rounded-full shadow-sm hover:bg-red-50 transition-all hover:shadow-md active:scale-95"
                        title="Restablecer menú original"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Limpiar Menú</span>
                    </button>

                    {!kitchenMode && activeTab === 'menu' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Añadir Plato</span>
                        </button>
                    )}
                </div>
            </header>

            {activeTab === 'menu' ? (
                /* MENU VIEW */
                <>
                    {/* Kitchen Mode view */}
                    {kitchenMode ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((item) => {
                                const isUnavailable = item.available === false;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => dispatch({ type: 'TOGGLE_AVAILABILITY', payload: { name: item.name } })}
                                        className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left active:scale-[0.97] ${isUnavailable
                                            ? 'bg-red-50 border-red-300 shadow-sm'
                                            : 'bg-emerald-50 border-emerald-300 shadow-sm hover:shadow-md'
                                            }`}
                                    >
                                        <div className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 ${isUnavailable ? 'grayscale opacity-60' : ''
                                            }`}>
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 text-base truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                                        </div>
                                        <div className="shrink-0">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold tracking-wide ${isUnavailable
                                                ? 'bg-red-500 text-white'
                                                : 'bg-emerald-500 text-white'
                                                }`}>
                                                {isUnavailable ? '✗ AGOTADO' : '✓ LISTO'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {items.map((item) => {
                                const isUnavailable = item.available === false;
                                return (
                                    <div
                                        key={item.id}
                                        className={`group bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col transition-all duration-300 ${isUnavailable
                                            ? 'border-red-100 opacity-70'
                                            : 'border-gray-100 hover:shadow-xl hover:-translate-y-1'
                                            }`}
                                    >
                                        {/* Image with Skeleton/Placeholder support */}
                                        <div className="w-full h-40 bg-gray-100 relative group overflow-hidden">
                                            <img
                                                src={item.image || PLACEHOLDER_IMAGE}
                                                alt={item.name}
                                                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${!item.available ? 'grayscale opacity-60' : ''}`}
                                                onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMAGE)}
                                            />
                                            {!item.available && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg tracking-wide">
                                                        AGOTADO
                                                    </span>
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm border border-gray-200">
                                                    <Tag className="w-3 h-3 mr-1 text-indigo-500" />
                                                    {item.category}
                                                </span>
                                            </div>
                                            {isUnavailable && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg tracking-wide">
                                                        AGOTADO
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6 flex flex-col flex-grow">
                                            <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors mb-2">
                                                {item.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-grow">
                                                {item.description}
                                            </p>
                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                                <div className={`flex items-start font-extrabold text-2xl transition-colors duration-300 ${isUnavailable ? 'text-gray-400' : 'text-gray-900 group-hover:text-indigo-600'}`}>
                                                    <span className="text-xs font-semibold text-gray-400 mt-1 mr-0.5">{CURRENCY}</span>
                                                    <span>{item.price.toFixed(2)}</span>
                                                </div>

                                                {/* Availability toggle switch */}
                                                <label className="flex items-center gap-2 cursor-pointer select-none" title={isUnavailable ? 'Marcar disponible' : 'Marcar agotado'}>
                                                    <span className={`text-xs font-medium ${isUnavailable ? 'text-red-500' : 'text-emerald-600'}`}>
                                                        {isUnavailable ? 'Agotado' : 'Disponible'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={!isUnavailable}
                                                        onClick={() => dispatch({ type: 'TOGGLE_AVAILABILITY', payload: { name: item.name } })}
                                                        className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isUnavailable ? 'bg-red-400' : 'bg-emerald-500'
                                                            }`}
                                                    >
                                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${isUnavailable ? 'translate-x-0' : 'translate-x-5'}`} />
                                                    </button>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                /* ORDERS VIEW */
                <div className="space-y-6">
                    {orders.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[32px] p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <ShoppingBag className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Sin pedidos aún</h3>
                            <p className="text-gray-400 text-sm mt-2 max-w-xs">Cuando un cliente realice un pedido desde su mesa, aparecerá aquí en tiempo real.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {orders.map((order) => (
                                <div key={order.id} className={`bg-white border rounded-[32px] p-8 shadow-sm transition-all duration-300 ${order.status === 'pending' ? 'border-indigo-100 ring-2 ring-indigo-50/50 scale-[1.02]' : 'border-gray-100 opacity-80'}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${order.status === 'pending' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-500'}`}>
                                                {order.table_number}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-900 text-lg">Mesa {order.table_number}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.status === 'pending' ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' :
                                            order.status === 'preparing' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                            {order.status === 'pending' ? '🔥 Pendiente' : order.status === 'preparing' ? '🍳 Preparando' : '✅ Listos'}
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8 bg-gray-50/50 rounded-2xl p-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-indigo-600 text-sm">{item.quantity}x</span>
                                                    <span className="font-bold text-gray-700 text-sm">{item.name}</span>
                                                </div>
                                                <span className="text-xs text-gray-400 font-bold">{CURRENCY} {(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Total Pedido</p>
                                            <p className="text-xl font-black text-gray-900">{CURRENCY} {order.total.toFixed(2)}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id!, 'preparing')}
                                                    className="h-12 px-6 rounded-xl bg-orange-600 text-white font-black text-xs hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-100"
                                                >
                                                    <Coffee className="w-4 h-4" />
                                                    PREPARAR
                                                </button>
                                            )}
                                            {order.status === 'preparing' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id!, 'delivered')}
                                                    className="h-12 px-6 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    ENTREGAR
                                                </button>
                                            )}
                                            {order.status === 'delivered' && (
                                                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs px-4">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    PEDIDO LISTO
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Hidden file picker */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* QR Modal */}
            {isQROpen && <QRModal onClose={() => setIsQROpen(false)} restaurantName="La Carta Digital" />}

            {/* Saved indicator footer */}
            <footer className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
                <div className="flex justify-center pb-3">
                    <span className="bg-white/90 backdrop-blur border border-emerald-100 text-emerald-600 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        ✨ Todos los cambios guardados localmente
                    </span>
                </div>
            </footer>

            {/* Reset confirmation modal */}
            {
                isResetConfirmOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsResetConfirmOpen(false)} />
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 p-6 text-center">
                            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Limpiar el menú?</h3>
                            <p className="text-sm text-gray-500 mb-6">Esta acción restablecerá todos los platos y precios al menú original y borrará los datos guardados.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsResetConfirmOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        dispatch({ type: 'RESET_MENU' });
                                        setIsResetConfirmOpen(false);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                                >
                                    Sí, limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Item Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={handleCloseModal}
                        />
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800">Nuevo Plato</h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleAddItem} className="p-6 space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del plato</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Ej: Lomo Saltado"
                                        value={newItem.name}
                                        onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>

                                {/* Price + Category */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 text-sm">{CURRENCY}</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.10"
                                                min="0"
                                                required
                                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                                placeholder="0.00"
                                                value={newItem.price || ''}
                                                onChange={e => setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                        <select
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                                            value={newItem.category}
                                            onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value as CategoryType }))}
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Detalles del plato..."
                                        value={newItem.description}
                                        onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>

                                {/* Image URL + Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (URL o archivo)</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                                            placeholder="https://... (o sube un archivo →)"
                                            value={imageUploaded ? '✅ Imagen local cargada' : newItem.image}
                                            readOnly={imageUploaded}
                                            onChange={e => !imageUploaded && setNewItem(prev => ({ ...prev, image: e.target.value }))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageUploaded(false);
                                                setNewItem(prev => ({ ...prev, image: '' }));
                                                fileInputRef.current?.click();
                                            }}
                                            title="Subir imagen desde tu dispositivo"
                                            className={`shrink-0 p-2.5 rounded-xl transition-all ${imageUploaded
                                                ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                                                : 'bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600'
                                                }`}
                                        >
                                            {imageUploaded
                                                ? <CheckCircle className="w-5 h-5" />
                                                : <Upload className="w-5 h-5" />
                                            }
                                        </button>
                                    </div>
                                    {/* Thumbnail preview */}
                                    {newItem.image && (
                                        <div className="mt-2 h-24 rounded-xl overflow-hidden border border-gray-100">
                                            <img
                                                src={newItem.image}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 mt-2"
                                >
                                    Guardar Plato
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MenuDashboard;
