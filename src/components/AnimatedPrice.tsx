import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CURRENCY } from '../types/menu';

interface AnimatedPriceProps {
    price: number;
}

export const AnimatedPrice = ({ price }: AnimatedPriceProps) => {
    const [isIncreased, setIsIncreased] = useState(false);

    // Detect price changes to trigger animation
    useEffect(() => {
        setIsIncreased(true);
        const timer = setTimeout(() => setIsIncreased(false), 1000);
        return () => clearTimeout(timer);
    }, [price]);

    return (
        <span className="relative inline-flex items-center font-bold">
            <span className="mr-1 text-xs">{CURRENCY}</span>
            <AnimatePresence mode='wait'>
                <motion.span
                    key={price}
                    initial={{ opacity: 0, y: 10, color: '#10B981' }} // Emerald-500
                    animate={{ opacity: 1, y: 0, color: isIncreased ? '#10B981' : 'inherit' }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={isIncreased ? "text-emerald-500" : ""}
                >
                    {price.toFixed(2)}
                </motion.span>
            </AnimatePresence>

            {/* Flash Effect Overlay */}
            {isIncreased && (
                <motion.span
                    initial={{ opacity: 0, scale: 1.5 }}
                    animate={{ opacity: 0, scale: 2 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-emerald-400 rounded-full blur-xl pointer-events-none"
                />
            )}
        </span>
    );
};
