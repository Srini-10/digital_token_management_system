import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail } from '../firebase/auth';
import { getUserProfile } from '../firebase/firestore';
import { LogIn, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill all fields');
            return;
        }
        setLoading(true);
        try {
            const user = await loginWithEmail(email, password);
            const profile = await getUserProfile(user.uid);
            const name = profile?.name || user.displayName || 'User';
            const role = profile?.role || 'citizen';

            // Custom themed success toast
            toast.custom((t) => (
                <div
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 ${t.visible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-2'}`}
                    style={{
                        background: '#ffffff',
                        border: '1px solid #a7f3d0',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                        maxWidth: '400px',
                        width: '100%',
                    }}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                        <LogIn size={18} style={{ color: '#059669' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: '#065f46' }}>
                            Welcome back, {name.split(' ')[0]}!
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b6860' }}>
                            Signed in as <span className="capitalize font-medium">{role}</span>
                        </p>
                    </div>
                </div>
            ), { duration: 3500 });

            if (role === 'superadmin') navigate('/superadmin');
            else if (role === 'admin') navigate('/admin-dashboard');
            else navigate('/citizen-dashboard');
        } catch (err) {
            // Custom themed error toast
            const msg = err.code === 'auth/invalid-credential'
                ? 'Invalid email or password.'
                : err.code === 'auth/user-not-found'
                    ? 'No account found with this email.'
                    : err.code === 'auth/wrong-password'
                        ? 'Incorrect password.'
                        : 'Login failed. Please try again.';

            toast.custom((t) => (
                <div
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 ${t.visible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-2'}`}
                    style={{
                        background: '#ffffff',
                        border: '1px solid #fecaca',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                        maxWidth: '400px',
                        width: '100%',
                    }}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                        <AlertCircle size={18} style={{ color: '#dc2626' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: '#991b1b' }}>
                            Sign in failed
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b6860' }}>{msg}</p>
                    </div>
                </div>
            ), { duration: 4000 });
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = { backgroundColor: '#f0ede6', border: '1px solid #d4ddd0', color: '#1c1917' };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10" style={{ backgroundColor: '#f0ede6' }}>
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                        <span className="text-xl font-bold" style={{ color: '#d4613a' }}>GT</span>
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: '#1c1917' }}>Welcome Back</h1>
                    <p className="text-sm mt-1" style={{ color: '#9c978f' }}>Sign in to your GovToken account</p>
                </div>
                <div className="rounded-3xl p-8 animate-slide-up" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b6860' }}>Email Address</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                                className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 placeholder:text-[#9c978f] transition-all" style={inputStyle} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b6860' }}>Password</label>
                            <div className="relative">
                                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required
                                    className="w-full px-4 py-3 rounded-2xl text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-orange-200 placeholder:text-[#9c978f] transition-all" style={inputStyle} />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9c978f' }}>{showPass ? 'Hide' : 'Show'}</button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full text-white font-semibold py-3 rounded-full transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                            style={{ backgroundColor: '#1c1917' }}>
                            {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>) : (<><LogIn size={16} /> Sign In</>)}
                        </button>
                    </form>
                    <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid #d4ddd0' }}>
                        <p className="text-sm" style={{ color: '#6b6860' }}>
                            Don't have an account?{' '}<Link to="/register" className="font-semibold hover:underline" style={{ color: '#d4613a' }}>Register here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
