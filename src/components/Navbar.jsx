import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';
import toast from 'react-hot-toast';

const Navbar = () => {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const role = userProfile?.role;

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
            navigate('/login');
        } catch {
            toast.error('Failed to logout');
        }
    };

    const citizenLinks = [
        { to: '/citizen-dashboard', label: 'Dashboard' },
        { to: '/book-token', label: 'Book Token' },
        { to: '/token-history', label: 'My Tokens' },
    ];

    const adminLinks = [
        { to: '/admin-dashboard', label: 'Dashboard' },
    ];

    // superadmin uses same dashboard as admin (unified)
    const links = (role === 'superadmin' || role === 'admin') ? adminLinks : citizenLinks;

    const isActive = (to) => location.pathname === to;

    return (
        <nav className="bg-gov-navy shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gov-gold rounded-full flex items-center justify-center font-bold text-gov-navy text-sm">
                            GT
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-white font-bold text-sm leading-tight">GovToken</p>
                            <p className="text-blue-200 text-xs">Digital Token System</p>
                        </div>
                    </Link>

                    {/* Desktop Nav Links */}
                    {currentUser && (
                        <div className="hidden md:flex items-center gap-1">
                            {links.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.to)
                                        ? 'bg-gov-gold text-gov-navy'
                                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {/* Live Screen link for all */}
                            <Link
                                to="/live"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/live')
                                    ? 'bg-gov-gold text-gov-navy'
                                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                                    }`}
                            >
                                🔴 Live
                            </Link>
                        </div>
                    )}

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {currentUser ? (
                            <>
                                <div className="hidden sm:block text-right">
                                    <p className="text-white text-xs font-medium">{userProfile?.name || currentUser.displayName || 'User'}</p>
                                    <p className="text-blue-300 text-xs capitalize">{role || 'citizen'}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="flex gap-2">
                                <Link to="/login" className="text-blue-100 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors">
                                    Login
                                </Link>
                                <Link to="/register" className="bg-gov-gold text-gov-navy text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors">
                                    Register
                                </Link>
                            </div>
                        )}
                        {/* Mobile menu button */}
                        <button
                            className="md:hidden text-white"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {menuOpen
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                }
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {menuOpen && currentUser && (
                    <div className="md:hidden pb-3 border-t border-blue-700 mt-2 pt-2 flex flex-col gap-1 animate-fade-in">
                        {links.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMenuOpen(false)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.to) ? 'bg-gov-gold text-gov-navy' : 'text-blue-100 hover:bg-blue-800'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link to="/live" onClick={() => setMenuOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-800">
                            🔴 Live Token Screen
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
