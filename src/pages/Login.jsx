import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail } from '../firebase/auth';
import { getUserProfile } from '../firebase/firestore';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) { toast.error('Please fill all fields'); return; }
        setLoading(true);
        try {
            const user = await loginWithEmail(email, password);
            const profile = await getUserProfile(user.uid);
            toast.success(`Welcome back, ${profile?.name || user.displayName || 'User'}!`);
            const role = profile?.role || 'citizen';
            if (role === 'superadmin') navigate('/superadmin');
            else if (role === 'admin') navigate('/admin-dashboard');
            else navigate('/citizen-dashboard');
        } catch (err) {
            const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password.'
                : err.code === 'auth/user-not-found' ? 'No account found with this email.'
                    : err.code === 'auth/wrong-password' ? 'Incorrect password.'
                        : 'Login failed. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 bg-gov-light">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gov-navy rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-gov-gold font-bold text-xl">GT</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gov-navy">Welcome Back</h1>
                    <p className="text-gray-500 text-sm mt-1">Sign in to your GovToken account</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 animate-slide-up">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-blue focus:border-transparent text-sm transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-blue focus:border-transparent text-sm pr-12 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                                >
                                    {showPass ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <p className="text-gray-500 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-gov-blue font-semibold hover:underline">
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                    🔒 Secured by Firebase Authentication
                </p>
            </div>
        </div>
    );
};

export default Login;
