import { useReducer, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MenuDashboard from './components/MenuDashboard';
import MobilePreview from './components/MobilePreview';
import { initialMenu } from './store/initialMenu';
import { menuReducer, type Action } from './store/menuReducer';
import { useMenuCommands } from './hooks/useMenuCommands';
import { useSupabaseListener } from './hooks/useSupabaseListener';
import { useOrdersListener } from './hooks/useOrdersListener';
import { speakConfirmation } from './utils/speech';
import {
  loadMenuFromSupabase,
  syncFullMenu,
  resetMenuInSupabase,
  updateMenuItem,
  supabaseToggleAvailability,
  supabaseUpdatePrice,
} from './services/supabaseService';
import { supabase } from './lib/supabaseClient';
import { Toaster, toast } from 'sonner';
import { Mic, MicOff, X, Wifi, WifiOff, Loader2 } from 'lucide-react';
import './App.css';

// ─── Environment Configuration ──────────────────────────────────────────────
const IS_SUPABASE_CONFIGURED = Boolean(import.meta.env.VITE_SUPABASE_URL);

/** Detect current view from URL parameter */
const getInitialView = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('view') || 'admin';
};

// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [items, rawDispatch] = useReducer(menuReducer, initialMenu);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dbReady, setDbReady] = useState(!IS_SUPABASE_CONFIGURED);
  const [currentView] = useState(getInitialView());

  // ── Boot: sync with Supabase on launch ──────────────────────────────────────
  useEffect(() => {
    const syncWithSupabase = async () => {
      if (!supabase) {
        setDbReady(true);
        return;
      }

      try {
        // 1. Intentar leer los platos de Supabase usando el servicio
        const data = await loadMenuFromSupabase();

        // 2. Si la base de datos está vacía, subir los platos iniciales (Seeding)
        if (data && data.length === 0) {
          console.log("[App] Empty DB — seeding with initial menu...");
          await syncFullMenu(initialMenu);
          console.log("[App] ✅ Datos iniciales subidos a Supabase");
        } else if (data) {
          console.log("[App] 📡 Datos recuperados de la nube");
          rawDispatch({ type: 'SET_MENU', payload: data });
        }

        setDbReady(true);
      } catch (err) {
        console.error('[App] Supabase sync failed:', err);
        setDbReady(true);
      }
    };

    syncWithSupabase();
  }, []);


  // ─── Middleware dispatch ──────────────────────────────────────────────────
  const dispatch = useCallback((action: Action) => {
    // 1. Update local state immediately (optimistic UI)
    rawDispatch(action);

    // 2. Audio feedback
    switch (action.type) {
      case 'ADD_ITEM':
        speakConfirmation(`Plato ${action.payload.name} añadido correctamente`);
        break;
      case 'UPDATE_PRICE':
        speakConfirmation(`Precio actualizado a ${action.payload.price} soles`);
        break;
      case 'UPDATE_PRICE_BY_NAME':
        speakConfirmation(`Precio de ${action.payload.name} actualizado a ${action.payload.price} soles`);
        break;
      case 'ADJUST_PRICE_BY_CATEGORY':
        speakConfirmation(`Precios de ${action.payload.category} ajustados`);
        break;
      case 'BULK_CATEGORY_DISCOUNT':
        speakConfirmation(`Descuento del ${action.payload.percentage} por ciento aplicado a ${action.payload.category}`);
        break;
      case 'TOGGLE_AVAILABILITY':
        speakConfirmation(`Entendido, ${action.payload.name} marcado. Disponibilidad actualizada.`);
        break;
      case 'RESET_MENU':
        speakConfirmation('Menú restablecido a los valores originales');
        break;
    }

    // 3. Supabase sync
    if (!IS_SUPABASE_CONFIGURED) return;

    (async () => {
      try {
        switch (action.type) {
          case 'TOGGLE_AVAILABILITY':
            await supabaseToggleAvailability(items, action.payload.name);
            break;
          case 'UPDATE_PRICE_BY_NAME':
            await supabaseUpdatePrice(items, action.payload.name, action.payload.price);
            break;
          case 'UPDATE_PRICE':
            await updateMenuItem(action.payload.id, { price: action.payload.price });
            break;
          case 'RESET_MENU':
            await resetMenuInSupabase(initialMenu);
            break;
          case 'ADD_ITEM':
          case 'BULK_CATEGORY_DISCOUNT':
          case 'ADJUST_PRICE_BY_CATEGORY':
            // Bulk sync handled by useEffect below
            break;
        }
      } catch (err) {
        console.error('[Supabase] sync failed:', err);
        toast.error('Error al sincronizar con la nube');
      }
    })();
  }, [items, rawDispatch]);

  // ── Deferred full-sync for bulk actions ──────────────────────────────────
  const [lastBulkAction, setLastBulkAction] = useState<string | null>(null);
  useEffect(() => {
    if (!IS_SUPABASE_CONFIGURED || !lastBulkAction || !dbReady) return;
    syncFullMenu(items).catch(err =>
      console.error('[Supabase] bulk sync failed:', err)
    );
  }, [items, lastBulkAction, dbReady]);

  const dispatchWithBulkTrack = useCallback((action: Action) => {
    if (['ADD_ITEM', 'BULK_CATEGORY_DISCOUNT', 'ADJUST_PRICE_BY_CATEGORY'].includes(action.type)) {
      setLastBulkAction(`${action.type}_${Date.now()}`);
    }
    dispatch(action);
  }, [dispatch]);

  const { isListening, toggleListening, transcript } = useMenuCommands({
    dispatch: dispatchWithBulkTrack,
    items,
  });

  // ── Real-time iPhone listener ──────────────────────────────────────────────
  const { items: liveItems, isLoading: liveLoading, error: liveError } = useSupabaseListener();

  // ── Real-time Orders listener ─────────────────────────────────────────────
  useOrdersListener((newOrder) => {
    // Play notification sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => { });

    // Show toast notification
    toast.success(`Pedido Recibido - Mesa ${newOrder.table_number}`, {
      description: `Total: S/ ${newOrder.total.toFixed(2)}`,
      duration: 5000,
      position: 'top-right'
    });

    // Voice notification
    speakConfirmation(`¡Nuevo pedido entrante de la mesa ${newOrder.table_number}!`);
  });

  const previewItems = IS_SUPABASE_CONFIGURED && liveItems.length > 0 ? liveItems : items;

  // ─── Render Customer View ───────────────────────────────────────────────
  if (currentView === 'customer') {
    return (
      <div className="bg-gray-100 min-h-screen flex justify-center items-start pt-4 px-4 pb-20">
        <Toaster position="top-center" richColors />
        <MobilePreview items={previewItems} />
      </div>
    );
  }

  // ─── Render Admin View (Default) ────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen relative overflow-x-hidden">
      <Toaster position="top-center" richColors />

      {/* Main Dashboard */}
      <div className="w-full min-h-screen">
        <MenuDashboard items={items} dispatch={dispatchWithBulkTrack} />
      </div>

      {/* Floating 📱 toggle button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-indigo-600 text-white flex flex-col items-center gap-1 pl-3 pr-2 py-4 rounded-l-2xl shadow-xl hover:bg-indigo-700 transition-all hover:-translate-x-0.5 hover:-translate-y-1/2 active:scale-95"
        title="Vista Cliente en Vivo"
      >
        <span className="text-lg">📱</span>
        <span
          className="text-[10px] font-semibold tracking-wide"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Vista Cliente
        </span>
      </button>

      {/* Drawer overlay + panel */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
            />

            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full z-50 w-full max-w-[520px] bg-gray-100 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📱</span>
                  <div>
                    <h2 className="font-bold text-gray-800 text-sm">Vista Cliente en Vivo</h2>
                    <p className="text-xs text-gray-400">
                      {IS_SUPABASE_CONFIGURED ? 'Supabase en tiempo real' : 'Estado local'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Connection status badge */}
                  {IS_SUPABASE_CONFIGURED ? (
                    liveLoading ? (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Conectando
                      </span>
                    ) : liveError ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-200">
                        <WifiOff className="w-3 h-3" />
                        Offline
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        <Wifi className="w-3 h-3" />
                        Supabase Live
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      EN VIVO
                    </span>
                  )}
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto flex justify-center items-start py-6 px-4">
                <MobilePreview items={previewItems} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Voice Command UI */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 z-40">
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white px-6 py-3 rounded-2xl shadow-xl border border-gray-100 text-gray-800 flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-medium">"{transcript}"</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggleListening}
          className={`p-5 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 ${isListening
            ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-500/20'
            : 'bg-black text-white hover:bg-gray-900 ring-8 ring-black/5'
            }`}
          title={isListening ? 'Detener escucha' : 'Activar comandos de voz'}
        >
          {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
      </div>
    </div>
  );
}

export default App;
