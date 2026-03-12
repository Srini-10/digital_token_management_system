import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';
import { LogOut, Menu, X, Radio, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const [showWelcome, setShowWelcome] = useState(false);
    const prevUserRef = useRef(null);

    const role = userProfile?.role;

    useEffect(() => {
        if (!prevUserRef.current && currentUser && userProfile) {
            setShowWelcome(true);
            const timer = setTimeout(() => setShowWelcome(false), 4000);
            return () => clearTimeout(timer);
        }
        prevUserRef.current = currentUser;
    }, [currentUser, userProfile]);

    const handleLogoutConfirm = async () => {
        setLoggingOut(true);
        try {
            await logout();
            setShowLogoutModal(false);

            // Custom themed logout success toast
            toast.custom((t) => (
                <div
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 ${t.visible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-2'}`}
                    style={{
                        background: '#ffffff',
                        border: '1px solid #a7f3d0',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                        maxWidth: '380px',
                        width: '100%',
                    }}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                        <CheckCircle size={18} style={{ color: '#059669' }} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: '#065f46' }}>Signed out</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b6860' }}>You've been logged out successfully</p>
                    </div>
                </div>
            ), { duration: 3000 });

            navigate('/login');
        } catch {
            // Custom themed error toast
            toast.custom((t) => (
                <div
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 ${t.visible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-2'}`}
                    style={{
                        background: '#ffffff',
                        border: '1px solid #fecaca',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                        maxWidth: '380px',
                        width: '100%',
                    }}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                        <AlertCircle size={18} style={{ color: '#dc2626' }} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>Logout failed</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b6860' }}>Something went wrong. Try again.</p>
                    </div>
                </div>
            ), { duration: 4000 });
        } finally {
            setLoggingOut(false);
        }
    };

    const citizenLinks = [
        { to: '/citizen-dashboard', label: 'Dashboard' },
        { to: '/book-token', label: 'Book Token' },
        { to: '/token-history', label: 'My Tokens' },
    ];
    const adminLinks = [{ to: '/admin-dashboard', label: 'Dashboard' }];
    const links = (role === 'superadmin' || role === 'admin') ? adminLinks : citizenLinks;
    const isActive = (to) => location.pathname === to;

    return (
        <>
            <nav className="sticky top-0 z-50" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #d4ddd0' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                                style={{ backgroundColor: '#d4613a', color: '#fff' }}>GT</div>
                            <div className="hidden sm:block">
                                <p className="font-bold text-sm leading-tight" style={{ color: '#1c1917' }}>GovToken</p>
                                <p className="text-xs" style={{ color: '#9c978f' }}>Digital Token System</p>
                            </div>
                        </Link>

                        {currentUser && (
                            <div className="hidden md:flex items-center gap-1 rounded-full px-1.5 py-1"
                                style={{ backgroundColor: '#f0ede6', border: '1px solid #d4ddd0' }}>
                                {links.map((link) => (
                                    <Link key={link.to} to={link.to}
                                        className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                                        style={isActive(link.to) ? { backgroundColor: '#ffffff', color: '#1c1917', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#6b6860' }}>
                                        {link.label}
                                    </Link>
                                ))}
                                <Link to="/live"
                                    className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                                    style={isActive('/live') ? { backgroundColor: '#ffffff', color: '#1c1917', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#6b6860' }}>
                                    <Radio size={10} className="text-red-500 animate-pulse" />
                                    Live
                                </Link>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            {currentUser ? (
                                <>
                                    <div className="hidden sm:block text-right">
                                        <p className="text-xs font-medium" style={{ color: '#1c1917' }}>{userProfile?.name || currentUser.displayName || 'User'}</p>
                                        <p className="text-xs capitalize" style={{ color: '#9c978f' }}>{role || 'citizen'}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                        style={{ backgroundColor: '#f0ede6', color: '#6b6860', border: '1px solid #d4ddd0' }}>
                                        {(userProfile?.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <button onClick={() => setShowLogoutModal(true)}
                                        className="text-sm px-3.5 py-1.5 rounded-full font-medium transition-all duration-200 flex items-center gap-1.5"
                                        style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                        <LogOut size={14} /> Logout
                                    </button>
                                </>
                            ) : (
                                <div className="flex gap-2">
                                    <Link to="/login" className="text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-200"
                                        style={{ color: '#6b6860', border: '1px solid #d4ddd0' }}>Login</Link>
                                    <Link to="/register" className="text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-200"
                                        style={{ backgroundColor: '#d4613a', color: '#fff' }}>Register</Link>
                                </div>
                            )}
                            <button className="md:hidden" style={{ color: '#1c1917' }} onClick={() => setMenuOpen(!menuOpen)}>
                                {menuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                    {menuOpen && currentUser && (
                        <div className="md:hidden pb-3 mt-2 pt-2 flex flex-col gap-1" style={{ borderTop: '1px solid #d4ddd0' }}>
                            {links.map((link) => (
                                <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                                    className="px-4 py-2.5 rounded-2xl text-sm font-medium transition-all"
                                    style={isActive(link.to) ? { backgroundColor: '#f0ede6', color: '#1c1917' } : { color: '#6b6860' }}>
                                    {link.label}
                                </Link>
                            ))}
                            <Link to="/live" onClick={() => setMenuOpen(false)}
                                className="px-4 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2" style={{ color: '#6b6860' }}>
                                <Radio size={10} className="text-red-500 animate-pulse" /> Live Token Screen
                            </Link>
                            <button onClick={() => { setMenuOpen(false); setShowLogoutModal(true); }}
                                className="px-4 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2 text-left"
                                style={{ color: '#dc2626' }}>
                                <LogOut size={14} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* ── Logout Confirmation Modal ──────────────────── */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
                    <div className="rounded-3xl p-6 max-w-sm w-full animate-slide-up"
                        style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                                <LogOut size={24} style={{ color: '#dc2626' }} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-center mb-1" style={{ color: '#1c1917' }}>Logout?</h3>
                        <p className="text-sm text-center mb-6" style={{ color: '#6b6860' }}>
                            Are you sure you want to sign out of your account?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all"
                                style={{ border: '1px solid #d4ddd0', color: '#6b6860' }}>
                                Cancel
                            </button>
                            <button onClick={handleLogoutConfirm} disabled={loggingOut}
                                className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ backgroundColor: '#dc2626' }}>
                                {loggingOut ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing out...</>
                                ) : (
                                    <><LogOut size={14} /> Yes, Logout</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Welcome Popup on Login ─────────────────────── */}
            {showWelcome && currentUser && userProfile && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-up"
                    style={{ width: '100%', maxWidth: '380px', padding: '0 16px' }}>
                    <div className="rounded-2xl p-4 flex items-center gap-3 shadow-lg"
                        style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0', boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }}>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                            <span className="font-bold text-sm" style={{ color: '#059669' }}>
                                {(userProfile.name || 'U')[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm" style={{ color: '#1c1917' }}>
                                Welcome back, {userProfile.name?.split(' ')[0] || 'User'}!
                            </p>
                            <p className="text-xs mt-0.5 truncate" style={{ color: '#9c978f' }}>
                                Signed in as <span className="capitalize">{role || 'citizen'}</span> · {userProfile.email}
                            </p>
                        </div>
                        <button onClick={() => setShowWelcome(false)} className="flex-shrink-0 p-1 rounded-full"
                            style={{ color: '#9c978f' }}>
                            <X size={16} />
                        </button>
                    </div>
                    <div className="mt-1 mx-4 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: '#e8ede5' }}>
                        <div className="h-full rounded-full" style={{ backgroundColor: '#059669', animation: 'shrinkBar 4s linear forwards' }} />
                    </div>
                    <style>{`@keyframes shrinkBar { 0% { width: 100%; } 100% { width: 0%; } }`}</style>
                </div>
            )}
        </>
    );
};

export default Navbar;
