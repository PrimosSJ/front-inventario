import { Link } from 'react-router-dom';
import { useAuth } from '../auth/authContext';

import QRIcon from '../icons/qr.jsx';


/**
 * Unified application header containing the main brand title,
 * navigation links, and user session controls.
 */
export default function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="bg-base-200 border-b border-b-[#fff2]">
            <div className="container mx-auto px-4 py-3 flex flex-col lg:flex-row items-center justify-between gap-4">

                {/* Brand / Title Section */}
                <div className="text-xl md:text-2xl font-bold text-center lg:text-left text-base-content">
                    <span className="text-primary">P</span>lataforma{" "}
                    <span className="text-primary">O</span>ptimizada de{" "}
                    <span className="text-primary">T</span>razabilidad y{" "}
                    <span className="text-primary">O</span>rganización
                </div>

                {/* Navigation & User Controls */}
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                    <nav className="flex flex-wrap items-center justify-center gap-8">
                        <Link
                            to="/inventario"
                            className="link-hover"
                        >
                            Inventario
                        </Link>
                        <Link
                            to="/"
                            className="link-hover"
                        >
                            Préstamos
                        </Link>
                        <Link
                            to="/historial_rut"
                            className="link-hover"
                        >
                            Historial
                        </Link>
                        <Link
                            to="/new_prestamo"
                            className="btn btn-primary btn-sm gap-2"
                        >
                            <QRIcon />
                            Prestar con QR
                        </Link>
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="flex items-center gap-3 md:border-l md:border-[#fff2] md:pl-6">
                        {user?.email && (
                            <span className="text-sm font-medium text-base-content/70 hidden sm:inline">
                                {user.email}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={logout}
                            className="btn btn-outline btn-error btn-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}