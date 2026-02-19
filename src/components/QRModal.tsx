import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, QrCode } from 'lucide-react';

interface QRModalProps {
    onClose: () => void;
    restaurantName?: string;
}

/** URL for the QR — always reflects the actual deployed domain (Vercel, ngrok, etc.) */
/** URL for the QR — points specifically to the customer digital menu view */
const MENU_URL = `${window.location.origin}${window.location.pathname}?view=customer`;

export const QRModal = ({ onClose, restaurantName = 'Nuestro Restaurante' }: QRModalProps) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=600,height=700');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8" />
                <title>QR - ${restaurantName}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        font-family: 'Segoe UI', system-ui, sans-serif;
                        background: #fff;
                        padding: 40px;
                    }
                    .qr-wrapper {
                        border: 2px solid #e5e7eb;
                        border-radius: 24px;
                        padding: 40px;
                        text-align: center;
                        max-width: 400px;
                    }
                    .title { font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 6px; }
                    .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 32px; }
                    svg { margin: 0 auto 32px; display: block; }
                    .footer { font-size: 12px; color: #9ca3af; margin-top: 16px; }
                    .url { font-size: 11px; color: #6366f1; word-break: break-all; margin-top: 8px; }
                </style>
            </head>
            <body>
                <div class="qr-wrapper">
                    <p class="title">${restaurantName}</p>
                    <p class="subtitle">Escanea para ver nuestra carta digital</p>
                    ${content.innerHTML}
                    <p class="footer">Menú digital • Disponible 24/7</p>
                    <p class="url">${MENU_URL}</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden z-10">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Código QR</h3>
                            <p className="text-xs text-gray-400">Menú digital del restaurante</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* QR Area */}
                <div className="px-6 py-8 flex flex-col items-center gap-4">
                    {/* Decorative ring */}
                    <div className="p-5 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl border border-indigo-100 shadow-inner">
                        <div ref={printRef}>
                            <QRCodeSVG
                                value={MENU_URL}
                                size={200}
                                level="H"
                                bgColor="#FFFFFF"
                                fgColor="#1e1b4b"
                                includeMargin
                            />
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="font-semibold text-gray-800 text-sm">{restaurantName}</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-[220px] leading-relaxed">
                            Escanea este código para ver la carta en tiempo real en tu móvil
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 max-w-[220px] truncate">{MENU_URL}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6">
                    <button
                        onClick={handlePrint}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-2xl transition-all active:scale-95 shadow-md shadow-indigo-200"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir QR
                    </button>
                </div>
            </div>
        </div>
    );
};
