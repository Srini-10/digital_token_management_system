import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmail } from '../firebase/auth';
import { createUserProfile } from '../firebase/firestore';
import { isFirstUser, autoSeedIfEmpty } from '../firebase/seedData';
import { Info } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();
    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.mobile || !form.password) { toast.error('Please fill all fields'); return; }
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
        if (!/^\d{10}$/.test(form.mobile)) { toast.error('Enter a valid 10-digit mobile number'); return; }
        setLoading(true);
        try {
            const firstUser = await isFirstUser();
            const role = firstUser ? 'superadmin' : 'citizen';
            const user = await registerWithEmail(form.email, form.password, form.name);
            await createUserProfile(user.uid, { name: form.name, email: form.email, mobile: form.mobile, role });
            await autoSeedIfEmpty();
            toast.success(firstUser ? 'Welcome, Super Admin!' : 'Account created!');
            navigate(firstUser ? '/superadmin' : '/citizen-dashboard');
        } catch (err) {
            toast.error(err.code === 'auth/email-already-in-use' ? 'Email already exists.' : 'Registration failed.');
        } finally { setLoading(false); }
    };

    const inputStyle = { backgroundColor: '#f0ede6', border: '1px solid #d4ddd0', color: '#1c1917' };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10" style={{ backgroundColor: '#f0ede6' }}>
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                        <span className="text-xl" style={{ color: '#d4613a' }}>GT</span>
                    </div>
                    <h1 className="text-2xl" style={{ color: '#1c1917' }}>Create Account</h1>
                    <p className="text-sm mt-1" style={{ color: '#9c978f' }}>Register to book government tokens</p>
                </div>
                <div className="rounded-2xl px-4 py-3 mb-4 text-sm flex items-start gap-2"
                    style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                    <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#1e40af" }} />
                    <span><strong>First time?</strong> The first registered user becomes the <strong>Super Admin</strong>.</span>
                </div>
                <div className="rounded-3xl p-8 animate-slide-up" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {[{ name: 'name', label: 'Full Name', type: 'text', ph: 'Surendhar A' },
                        { name: 'email', label: 'Email', type: 'email', ph: 'you@example.com' },
                        { name: 'mobile', label: 'Mobile Number', type: 'tel', ph: '9876543210' }].map(f => (
                            <div key={f.name}>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b6860' }}>{f.label}</label>
                                <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.ph} required
                                    className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 placeholder:text-[#9c978f]" style={inputStyle} />
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b6860' }}>Password</label>
                            <div className="relative">
                                <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required
                                    className="w-full px-4 py-3 rounded-2xl text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-orange-200 placeholder:text-[#9c978f]" style={inputStyle} />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9c978f' }}>{showPass ? 'Hide' : 'Show'}</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#6b6860' }}>Confirm Password</label>
                            <input type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="Re-enter password" required
                                className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 placeholder:text-[#9c978f]" style={inputStyle} />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full text-white font-semibold py-3 rounded-full transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                            style={{ backgroundColor: '#1c1917' }}>
                            {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Setting up...</>) : 'Create Account'}
                        </button>
                    </form>
                    <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid #d4ddd0' }}>
                        <p className="text-sm" style={{ color: '#6b6860' }}>
                            Already have an account?{' '}<Link to="/login" className="font-semibold hover:underline" style={{ color: '#d4613a' }}>Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
