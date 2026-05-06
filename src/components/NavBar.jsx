import { Link } from 'react-router-dom';
import { useAuth } from './auth/authContext';

export default function NavBar() {
    const { user, logout } = useAuth();

    return (
        <div className='container mx-auto flex flex-wrap items-center justify-between gap-2 py-3'>
            <div className='flex flex-wrap items-center gap-1'>
                <Link
                    to='/inventario'
                    className='font-bold py-2 px-4 rounded hover:bg-base-200'
                >
                    Inventario
                </Link>
                <Link
                    to='/'
                    className='font-bold py-2 px-4 rounded hover:bg-base-200'
                >
                    Préstamos
                </Link>
                <Link
                    to='/historial_rut'
                    className='font-bold py-2 px-4 rounded hover:bg-base-200'
                >
                    Historial por Rut
                </Link>
                <Link
                    to='/new_prestamo'
                    className='btn btn-primary btn-sm gap-2 ml-2'
                >
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        className='w-4 h-4'
                        aria-hidden='true'
                    >
                        <rect x='3' y='3' width='7' height='7' />
                        <rect x='14' y='3' width='7' height='7' />
                        <rect x='3' y='14' width='7' height='7' />
                        <path d='M14 14h3v3h-3zM20 14h1v1h-1zM14 20h1v1h-1zM20 20h1v1h-1zM17 17h3v3h-3z' />
                    </svg>
                    Prestar con QR
                </Link>
            </div>

            <div className='flex items-center gap-3'>
                {user?.email && (
                    <span className='text-sm text-gray-600 hidden sm:inline'>
                        {user.email}
                    </span>
                )}
                <button
                    type='button'
                    onClick={logout}
                    className='btn btn-ghost btn-sm'
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
