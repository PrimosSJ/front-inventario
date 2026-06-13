import { createBrowserRouter, useLocation, useOutlet, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import AgregarPrestamo from './components/prestamos/AgregarPrestamo';
import Inventario from './components/Inventario';
import Prestamos from './components/Prestamos';
import ItemView from './components/inventario/ItemView';
import GetAllByRut from './components/prestamos/GetAllByRut';
import Header from './components/shared/Header';

/**
 * Wrapper for the New Loan Page to handle routing parameters and modal-like behavior.
 */
const NewLoanPageWrapper = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div className="container mx-auto p-4 max-w-2xl mt-8">
            <div className="bg-base-100 p-6 rounded-box shadow-lg border border-base-content/10">
                <AgregarPrestamo
                    initialProductId={id}
                    onClose={() => navigate('/inventario')}
                />
            </div>
        </div>
    );
};

/**
 * Handles smooth page transitions using Framer Motion.
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
                className="flex-1 w-full flex flex-col"
            >
                {currentOutlet}
            </motion.main>
        </AnimatePresence>
    );
};

/**
 * Shared layout component providing the global Header and layout structure.
 */
const MainLayout = () => {
    return (
        <>
            <Header />
            <PageTransitionProvider />
        </>
    );
};

/**
 * Global Data Router Configuration.
 */
export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <Prestamos />
            },
            {
                path: 'inventario',
                element: <Inventario />
            },
            {
                path: 'inventario/:id',
                element: <ItemView />
            },
            {
                path: 'new_prestamo/:id',
                element: <NewLoanPageWrapper />
            },
            {
                path: 'historial_rut',
                element: <GetAllByRut />
            }
        ]
    }
]);