import { createBrowserRouter } from 'react-router-dom';

// Layouts
import MainLayout from './MainLayout';

// Pages (Master Routes)
import LoansPage from '../pages/LoansPage';
import InventoryPage from '../pages/InventoryPage';
import ItemDetailsPage from '../pages/ItemDetailsPage';
import NewLoanPage from '../pages/NewLoanPage';
import HistoryPage from '../pages/HistoryPage';

/**
 * Global Application Router Configuration.
 * Maintains strict separation between route definitions and UI components.
 */
export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <LoansPage />
            },
            {
                path: 'inventario',
                element: <InventoryPage />
            },
            {
                path: 'inventario/:id',
                element: <ItemDetailsPage />
            },
            {
                path: 'new_prestamo/:id',
                element: <NewLoanPage />
            },
            {
                path: 'historial_rut',
                element: <HistoryPage />
            }
        ]
    }
]);