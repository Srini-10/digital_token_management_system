import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmail } from '../firebase/auth';
import { createUserProfile } from '../firebase/firestore';
import { isFirstUser, autoSeedIfEmpty } from '../firebase/seedData';
import toast from 'react-hot-toast';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.mobile || !form.password) {
            toast.error('Please fill all fields'); return;
        }
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
        if (!/^\d{10}$/.test(form.mobile)) { toast.error('Enter a valid 10-digit mobile number'); return; }

        setLoading(true);
        try {
            // Check if this is the very first user — auto-promote to superadmin
            const firstUser = await isFirstUser();
            const role = firstUser ? 'superadmin' : 'citizen';

            const user = await registerWithEmail(form.email, form.password, form.name);
            await createUserProfile(user.uid, {
                name: form.name,
                email: form.email,
                mobile: form.mobile,
                role,
            });

            // Seed demo data now that auth is established (needed for Firestore rules)
            await autoSeedIfEmpty();

            if (firstUser) {
                toast.success('Welcome, Super Admin! Demo departments have been created. 🎉');
                navigate('/superadmin');
            } else {
                toast.success('Account created! Welcome to GovToken 🎉');
                navigate('/citizen-dashboard');
            }
        } catch (err) {
            const msg = err.code === 'auth/email-already-in-use' ? 'An account with this email already exists.'
                : err.code === 'auth/weak-password' ? 'Password is too weak.'
                    : 'Registration failed. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 bg-gov-light">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gov-navy rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-gov-gold font-bold text-xl">GT</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gov-navy">Create Account</h1>
                    <p className="text-gray-500 text-sm mt-1">Register to book government tokens</p>
                </div>

                {/* First-user info banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700 flex items-start gap-2">
                    <span className="mt-0.5">ℹ️</span>
                    <span>
                        <strong>First time?</strong> The first registered user automatically becomes the <strong>Super Admin</strong> with full access to manage departments and admins.
                    </span>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 animate-slide-up">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {[
                            { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Surendhar A' },
                            { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
                            { name: 'mobile', label: 'Mobile Number', type: 'tel', placeholder: '9876543210' },
                        ].map(field => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={form[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-blue focus:border-transparent text-sm transition-all"
                                    required
                                />
                            </div>
                        ))}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Min. 6 characters"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-blue text-sm pr-12 transition-all"
                                    required
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                                    {showPass ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                            <input
                                type="password"
                                name="confirm"
                                value={form.confirm}
                                onChange={handleChange}
                                placeholder="Re-enter password"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-blue text-sm transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Setting up your account...</>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <p className="text-gray-500 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-gov-blue font-semibold hover:underline">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
