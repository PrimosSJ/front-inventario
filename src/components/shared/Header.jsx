import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { useState } from 'react';

import AgregarPrestamo from '../prestamos/AgregarPrestamo';

import QRIcon from '../icons/qr.jsx';


/**
 * Unified application header containing the main brand title,
 * navigation links, and user session controls.
 */
export default function Header() {
    const { user, logout } = useAuth();

    const [showPrestamoModal, setShowPrestamoModal] = useState(false);

    const linkClass = ({ isActive }) =>
        `transition-all duration-200 ${isActive ? 'text-primary border-b-2 border-primary' : 'link-hover text-base-content/80'}`;

    return (
        <header className="bg-gradient-to-r overflow-hidden from-base-200 to-transparent from-[50%] border-b border-b-[#fff1]">
            <div className="relative container mx-auto px-4 py-3 flex flex-col lg:flex-row items-center justify-between gap-4">

                {/* Brand / Title Section */}
                <a href="/" className="h-full group text-lg md:text-xl text-center lg:text-left text-base-content">
                    <img className='h-12 w-auto z-100 absolute bottom-0' src="/logo.png" alt="Logo de POTO" />
                    <p className='absolute ml-20 pointer-events-none left-0 top-1/2 -translate-y-1/2 transition-all duration-200 -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100'>
                        <span className="text-primary">P</span>lataforma{" "}
                        <span className="text-primary">O</span>ptimizada de{" "}
                        <span className="text-primary">T</span>razabilidad y{" "}
                        <span className="text-primary">O</span>rganización
                    </p>
                </a>

                {/* Navigation & User Controls */}
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                    <nav className="flex flex-wrap items-center justify-center gap-8">
                        <NavLink
                            to="/inventario"
                            className={linkClass}
                        >
                            Inventario
                        </NavLink>
                        <NavLink
                            to="/"
                            className={linkClass}
                            end
                        >
                            Préstamos
                        </NavLink>
                        <NavLink
                            to="/historial_rut"
                            className={linkClass}
                        >
                            Historial
                        </NavLink>
                        <button
                            onClick={() => setShowPrestamoModal(true)}
                            className="btn btn-primary btn-sm gap-2"
                        >
                            <QRIcon />
                            Prestar con QR
                        </button>
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

            {showPrestamoModal && (
                <div className="modal modal-open">
                    <div className="modal-box overflow-visible">
                        <AgregarPrestamo onClose={() => setShowPrestamoModal(false)} />
                    </div>
                </div>
            )}
        </header>
    );
}