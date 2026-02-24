import { useEffect, useState } from 'react';
import {
    getDepartments, addDepartment, updateDepartment, deleteDepartment,
    getAllAdmins, createUserProfile, updateUserProfile,
} from '../firebase/firestore';
import { registerWithEmail } from '../firebase/auth';
import { getTokensByDateRange } from '../firebase/firestore';
import { forceSeedDemo } from '../firebase/seedData';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const TABS = ['overview', 'departments', 'admins'];

const SuperAdminPanel = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [departments, setDepartments] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);

    // Forms
    const [deptForm, setDeptForm] = useState({ department_name: '', office_location: '' });
    const [adminForm, setAdminForm] = useState({ name: '', email: '', mobile: '', password: '' });
    const [savingDept, setSavingDept] = useState(false);
    const [savingAdmin, setSavingAdmin] = useState(false);
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [depts, adminList] = await Promise.all([getDepartments(false), getAllAdmins()]);
                setDepartments(depts);
                setAdmins(adminList);

                // Last 7 days analytics
                const end = format(new Date(), 'yyyy-MM-dd');
                const start = format(subDays(new Date(), 6), 'yyyy-MM-dd');
                const tokens = await getTokensByDateRange(start, end);
                const byDate = tokens.reduce((acc, t) => {
                    acc[t.booking_date] = acc[t.booking_date] || { date: t.booking_date, total: 0, completed: 0, cancelled: 0 };
                    acc[t.booking_date].total++;
                    if (t.status === 'completed') acc[t.booking_date].completed++;
                    if (t.status === 'cancelled') acc[t.booking_date].cancelled++;
                    return acc;
                }, {});
                setAnalytics(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
            } catch (err) {
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleAddDept = async (e) => {
        e.preventDefault();
        if (!deptForm.department_name || !deptForm.office_location) { toast.error('Fill all fields'); return; }
        setSavingDept(true);
        try {
            const ref = await addDepartment(deptForm);
            setDepartments([...departments, { id: ref.id, ...deptForm, isActive: true }]);
            setDeptForm({ department_name: '', office_location: '' });
            toast.success('Department added!');
        } catch {
            toast.error('Failed to add department');
        } finally {
            setSavingDept(false);
        }
    };

    const handleToggleDept = async (dept) => {
        try {
            await updateDepartment(dept.id, { isActive: !dept.isActive });
            setDepartments(departments.map(d => d.id === dept.id ? { ...d, isActive: !d.isActive } : d));
            toast.success(`Department ${dept.isActive ? 'deactivated' : 'activated'}`);
        } catch {
            toast.error('Failed to update');
        }
    };

    const handleDeleteDept = async (id) => {
        if (!window.confirm('Delete this department? This cannot be undone.')) return;
        try {
            await deleteDepartment(id);
            setDepartments(departments.filter(d => d.id !== id));
            toast.success('Department deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        const { name, email, mobile, password } = adminForm;
        if (!name || !email || !mobile || !password) { toast.error('Fill all fields'); return; }
        if (password.length < 6) { toast.error('Password min 6 characters'); return; }
        setSavingAdmin(true);
        try {
            const user = await registerWithEmail(email, password, name);
            await createUserProfile(user.uid, { name, email, mobile, role: 'admin' });
            setAdmins([...admins, { id: user.uid, name, email, mobile, role: 'admin' }]);
            setAdminForm({ name: '', email: '', mobile: '', password: '' });
            toast.success(`Admin ${name} created!`);
        } catch (err) {
            const msg = err.code === 'auth/email-already-in-use' ? 'Email already in use' : 'Failed to create admin';
            toast.error(msg);
        } finally {
            setSavingAdmin(false);
        }
    };

    const handleRemoveAdmin = async (id) => {
        if (!window.confirm('Remove admin access from this user?')) return;
        try {
            await updateUserProfile(id, { role: 'citizen' });
            setAdmins(admins.filter(a => a.id !== id));
            toast.success('Admin demoted to citizen');
        } catch {
            toast.error('Failed to remove admin');
        }
    };

    const handleForceSeed = async () => {
        if (!window.confirm('This will ADD 6 demo departments + 7 days of slots. Continue?')) return;
        setSeeding(true);
        try {
            const result = await forceSeedDemo();
            toast.success(`✅ Created ${result.departments} departments + slots for ${result.days} days!`);
            // Reload departments list
            const depts = await getDepartments(false);
            setDepartments(depts);
        } catch (err) {
            toast.error('Seed failed: ' + (err.message || err.code));
        } finally {
            setSeeding(false);
        }
    };

    const totalTokens = analytics.reduce((s, d) => s + d.total, 0);
    const totalCompleted = analytics.reduce((s, d) => s + d.completed, 0);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gov-gold rounded-xl flex items-center justify-center">
                    <span className="text-gov-navy font-bold">SA</span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gov-navy">Super Admin Panel</h1>
                    <p className="text-gray-500 text-sm">System-wide management</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-gov-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gov-blue'}`}
                    >
                        {tab === 'overview' ? '📊 Overview' : tab === 'departments' ? '🏢 Departments' : '👤 Admins'}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Departments', value: departments.length, color: 'text-gov-blue' },
                            { label: 'Admins', value: admins.length, color: 'text-amber-600' },
                            { label: 'Tokens (7d)', value: totalTokens, color: 'text-purple-600' },
                            { label: 'Completed (7d)', value: totalCompleted, color: 'text-green-600' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                                <p className="text-gray-500 text-sm mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    {departments.length === 0 && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold text-amber-800">No departments found!</p>
                                <p className="text-amber-700 text-sm mt-0.5">Load demo Tamil Nadu departments and slots to get started.</p>
                            </div>
                            <button
                                onClick={handleForceSeed}
                                disabled={seeding}
                                className="shrink-0 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                            >
                                {seeding ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Seeding...</>
                                ) : '🌱 Load Demo Data'}
                            </button>
                        </div>
                    )}

                    {analytics.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h2 className="font-semibold text-gov-navy mb-4">Last 7 Days – Daily Bookings</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={analytics}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" fontSize={11} />
                                    <YAxis fontSize={11} />
                                    <Tooltip />
                                    <Bar dataKey="total" name="Total" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="completed" name="Completed" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="cancelled" name="Cancelled" fill="#dc2626" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && (
                <div className="grid lg:grid-cols-3 gap-6">
                    <div>
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h2 className="font-semibold text-gov-navy mb-4">Add Department</h2>
                            <form onSubmit={handleAddDept} className="space-y-3">
                                <input
                                    type="text"
                                    value={deptForm.department_name}
                                    onChange={e => setDeptForm(p => ({ ...p, department_name: e.target.value }))}
                                    placeholder="Department Name"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue"
                                />
                                <input
                                    type="text"
                                    value={deptForm.office_location}
                                    onChange={e => setDeptForm(p => ({ ...p, office_location: e.target.value }))}
                                    placeholder="Office Location"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue"
                                />
                                <button
                                    type="submit"
                                    disabled={savingDept}
                                    className="w-full bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                                >
                                    {savingDept ? 'Adding...' : '+ Add Department'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-50">
                                <h2 className="font-semibold text-gov-navy">All Departments ({departments.length})</h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {departments.map(d => (
                                    <div key={d.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                                        <div>
                                            <p className="font-medium text-gov-navy text-sm">{d.department_name}</p>
                                            <p className="text-gray-500 text-xs">📍 {d.office_location}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggleDept(d)}
                                                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${d.isActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                            >
                                                {d.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDept(d.id)}
                                                className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg font-medium transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {departments.length === 0 && (
                                    <div className="text-center py-10 text-gray-400 text-sm">No departments added.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admins Tab */}
            {activeTab === 'admins' && (
                <div className="grid lg:grid-cols-3 gap-6">
                    <div>
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h2 className="font-semibold text-gov-navy mb-4">Create Admin User</h2>
                            <form onSubmit={handleAddAdmin} className="space-y-3">
                                {[
                                    { name: 'name', placeholder: 'Full Name', type: 'text' },
                                    { name: 'email', placeholder: 'Email', type: 'email' },
                                    { name: 'mobile', placeholder: 'Mobile (10 digits)', type: 'tel' },
                                    { name: 'password', placeholder: 'Password (min 6)', type: 'password' },
                                ].map(f => (
                                    <input
                                        key={f.name}
                                        type={f.type}
                                        value={adminForm[f.name]}
                                        onChange={e => setAdminForm(p => ({ ...p, [f.name]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue"
                                    />
                                ))}
                                <button
                                    type="submit"
                                    disabled={savingAdmin}
                                    className="w-full bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                                >
                                    {savingAdmin ? 'Creating...' : '+ Create Admin'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-50">
                                <h2 className="font-semibold text-gov-navy">Admin Users ({admins.length})</h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {admins.map(a => (
                                    <div key={a.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gov-light rounded-full flex items-center justify-center text-gov-navy font-bold text-sm">
                                                {(a.name || 'A')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gov-navy text-sm">{a.name}</p>
                                                <p className="text-gray-500 text-xs">{a.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAdmin(a.id)}
                                            className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg font-medium transition-colors"
                                        >
                                            Remove Admin
                                        </button>
                                    </div>
                                ))}
                                {admins.length === 0 && (
                                    <div className="text-center py-10 text-gray-400 text-sm">No admin users yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPanel;
