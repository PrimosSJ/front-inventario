import { useParams, useNavigate } from 'react-router-dom';
import AgregarPrestamo from '../components/prestamos/AgregarPrestamo';

/**
 * Wrapper for the New Loan Page to handle routing parameters and modal-like behavior.
 * Acts as a master route view.
 */
export default function NewLoanPage() {
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
}