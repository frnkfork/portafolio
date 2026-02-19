import { useState, useEffect, useCallback, useRef } from 'react';
import type { Action } from '../store/menuReducer';
import type { MenuData } from '../types/menu';
import { speakConfirmation } from '../utils/speech';

// Extend Window interface for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface UseMenuCommandsProps {
    dispatch: React.Dispatch<Action>;
    items: MenuData;
}

export const useMenuCommands = ({ dispatch, items }: UseMenuCommandsProps) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognition, setRecognition] = useState<any>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    // Keep a ref to latest items so processCommand closure is never stale
    const itemsRef = useRef(items);
    useEffect(() => { itemsRef.current = items; }, [items]);

    const processCommand = useCallback((command: string) => {
        console.log("Procesando comando:", command);
        const lowerCommand = command.toLowerCase();

        // ─── Status report ────────────────────────────────────────────────────
        // "Status del menú", "Estado del menú"
        if (/(?:status|estado|reporte)(?:\s+del?)?\s+men[uú]/i.test(lowerCommand)) {
            const current = itemsRef.current;
            const soldOut = current.filter(i => !i.available);
            const available = current.filter(i => i.available);
            const message = soldOut.length === 0
                ? `Todo en orden. Los ${available.length} platos del menú están disponibles.`
                : `Atención. Hay ${soldOut.length} plato${soldOut.length > 1 ? 's' : ''} agotado${soldOut.length > 1 ? 's' : ''}: ${soldOut.map(i => i.name).join(', ')}. ${available.length} platos disponibles.`;
            speakConfirmation(message);
            return;
        }
        // ─── Availability patterns ────────────────────────────────────────────
        // "Agotar Lomo Saltado", "Marca Causa como agotado"
        const markUnavailableMatch = lowerCommand.match(
            /(?:agotar|agota|marcar? (?:como )?agotado?|sin disponibilidad)\s+(.+)/i
        );
        if (markUnavailableMatch) {
            const itemName = markUnavailableMatch[1].trim();
            dispatch({ type: 'TOGGLE_AVAILABILITY', payload: { name: itemName } });
            return;
        }

        // "Causa disponible", "Habilitar Chicha Morada", "Pon Lomo Saltado disponible"
        const markAvailableMatch = lowerCommand.match(
            /(?:habilitar?|activar?|disponible?|pon(?:er)?.*disponible)\s+(.+)|(.+)\s+(?:está\s+)?disponible/i
        );
        if (markAvailableMatch) {
            const itemName = (markAvailableMatch[1] || markAvailableMatch[2] || '').trim();
            if (itemName) {
                dispatch({ type: 'TOGGLE_AVAILABILITY', payload: { name: itemName } });
                return;
            }
        }

        // ─── Bulk discount ────────────────────────────────────────────────────
        // "Baja 10% a los Fondos"
        const discountMatch = lowerCommand.match(
            /(?:baja|descuenta|reduce|aplica descuento)(?:.*?de)?\s+(\d+(?:\.\d+)?)\s*%\s+(?:a|en|para|de)\s+(?:la\s+|el\s+|las\s+|los\s+)?(.+)/i
        );
        if (discountMatch) {
            const percentage = parseFloat(discountMatch[1]);
            const categoryTarget = discountMatch[2].toLowerCase().trim();
            if (!isNaN(percentage)) {
                dispatch({ type: 'BULK_CATEGORY_DISCOUNT', payload: { category: categoryTarget, percentage } });
                return;
            }
        }

        // ─── Increase by category ─────────────────────────────────────────────
        const increaseMatch = lowerCommand.match(
            /(?:sube|aumenta|incrementa)(?:.*?precio)?\s+(\d+(?:\.\d+)?)(?:\s*(?:soles|bs|s\/))?\\s+(?:a|en|para)\s+(?:la\s+|el\s+|las\s+|los\s+)?(.+)/i
        );
        if (increaseMatch) {
            const amount = parseFloat(increaseMatch[1]);
            const categoryTarget = increaseMatch[2].toLowerCase().trim();
            if (!isNaN(amount)) {
                dispatch({ type: 'ADJUST_PRICE_BY_CATEGORY', payload: { category: categoryTarget, amount } });
                return;
            }
        }

        // ─── Decrease by category ─────────────────────────────────────────────
        const decreaseMatch = lowerCommand.match(
            /(?:baja|disminuye|reduce|descuenta)(?:.*?precio)?\s+(\d+(?:\.\d+)?)(?:\s*(?:soles|bs|s\/))?\\s+(?:a|en|para|de)\s+(?:la\s+|el\s+|las\s+|los\s+)?(.+)/i
        );
        if (decreaseMatch) {
            const amount = parseFloat(decreaseMatch[1]);
            const categoryTarget = decreaseMatch[2].toLowerCase().trim();
            if (!isNaN(amount)) {
                dispatch({ type: 'ADJUST_PRICE_BY_CATEGORY', payload: { category: categoryTarget, amount: -amount } });
                return;
            }
        }

        // ─── Change price by name ─────────────────────────────────────────────
        const changePriceMatch = lowerCommand.match(
            /(?:cambia|pon|ajusta|fija|establece)(?:.*?precio\s+de|.*?costo\s+de|\s+de|\s+el)?\s+(.+?)\s+(?:a|en|por)\s+(?:s\/\.?\s*)?(\d+(?:\.\d+)?)/i
        );
        if (changePriceMatch) {
            const productName = changePriceMatch[1].toLowerCase().trim();
            const newPrice = parseFloat(changePriceMatch[2]);
            if (!isNaN(newPrice)) {
                dispatch({ type: 'UPDATE_PRICE_BY_NAME', payload: { name: productName, price: newPrice } });
            }
        }
    }, [dispatch]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.lang = 'es-PE';
            recognitionInstance.interimResults = false;

            recognitionInstance.onstart = () => console.log("Reconocimiento iniciado.");

            recognitionInstance.onresult = (event: any) => {
                const lastResultIndex = event.results.length - 1;
                const command = event.results[lastResultIndex][0].transcript.trim();
                console.log("Comando recibido:", command);
                setTranscript(command);
                processCommand(command);
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                console.log("Reconocimiento detenido.");
                setIsListening(false);
            };

            recognitionInstance.onerror = (event: any) => {
                console.error("Error de reconocimiento:", event.error);
                if (event.error === 'network') {
                    setIsBlocked(true);
                    setTimeout(() => setIsBlocked(false), 1000);
                }
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        }
    }, [processCommand]);

    const toggleListening = useCallback(() => {
        if (!recognition || isBlocked) return;
        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            try {
                recognition.start();
                setIsListening(true);
            } catch (error) {
                console.error("No se pudo iniciar el reconocimiento:", error);
                setIsListening(true);
            }
        }
    }, [isListening, recognition, isBlocked]);

    return { isListening, toggleListening, transcript };
};
