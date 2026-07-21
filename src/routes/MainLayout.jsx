import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/layout/Header';

/**
 * Handles smooth page transitions using Framer Motion.
 * Isolates animation logic from routing configuration.
 */
const PageTransitionProvider = () => {
    const location = useLocation();
    const currentOutlet = useOutlet();

    return (
        <AnimatePresence mode="wait">
            <motion.main
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex-1 min-h-0 w-full flex flex-col"
            >
                {currentOutlet}
            </motion.main>
        </AnimatePresence>
    );
};

/**
 * Shared layout component providing the global Header and layout structure.
 */
export default function MainLayout() {
    return (
        <>
            <Header />
            <PageTransitionProvider />
        </>
    );
}