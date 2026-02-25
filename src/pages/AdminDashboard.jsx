import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getDepartments, updateTokenStatus } from '../firebase/firestore';
import { registerWithEmail } from '../firebase/auth';
import { format, subDays, addDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const FRESH_DEPARTMENTS = [
    { department_name: 'RTO Office', office_location: 'Regional Transport Office, Anna Salai, Chennai', subdivisions: ['New Vehicle Registration', 'Driving Licence (Fresh)', 'Driving Licence Renewal', 'RC Transfer / Ownership Change', 'NOC (No Objection Certificate)', 'Pollution Certificate (PUC)', 'Hypothecation Addition / Removal'] },
    { department_name: 'Revenue Office', office_location: 'District Collectorate, Rajaji Salai, Chennai', subdivisions: ['Patta / Chitta (Land Records)', 'Birth Certificate', 'Death Certificate', 'Income Certificate', 'Community Certificate', 'Nativity Certificate', 'Legal Heir Certificate'] },
    { department_name: 'Municipal Corporation', office_location: 'Ripon Building, Park Town, Chennai', subdivisions: ['Property Tax Payment', 'Trade Licence', 'Building Plan Approval', 'Water & Sewerage Connection', 'Birth / Death Certificate', 'Encumbrance Certificate'] },
    { department_name: 'Passport Seva Kendra', office_location: 'PSK Chennai, Kathipara Junction, Guindy', subdivisions: ['Fresh Passport Application', 'Tatkal Passport', 'Passport Renewal', 'Police Clearance Certificate (PCC)', 'Passport for Minor'] },
    { department_name: 'Aadhaar Centre (UIDAI)', office_location: 'UIDAI Office, Haddows Road, Nungambakkam', subdivisions: ['New Aadhaar Enrolment', 'Address Update', 'Mobile Number Update', 'Biometric Update', 'Name / DOB Correction', 'Aadhaar Card Reprint'] },
    { department_name: 'Employment Office', office_location: 'District Employment Office, Egmore, Chennai', subdivisions: ['New Job Registration', 'Registration Renewal', 'Employment Certificate', 'Job Fair Participation', 'Skill Development Enquiry'] },
    { department_name: 'Ration Shop (PDS)', office_location: 'Taluk Supply Office, Purasaiwakkam, Chennai', subdivisions: ['New Ration Card Application', 'Card Correction / Update', 'Member Addition / Removal', 'Surrender of Ration Card', 'Duplicate Card Request', 'Category Change (BPL / APL / AAY)'] },
];

const SLOT_TIMES = [
    '09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM', '11:00 AM - 11:30 AM', '11:30 AM - 12:00 PM',
    '02:00 PM - 02:30 PM', '02:30 PM - 03:00 PM', '03:00 PM - 03:30 PM',
];

const statusBadge = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    called: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const tabs = [
    { id: 'tokens', label: '🎫 Live Tokens' },
    { id: 'departments', label: '🏢 Departments' },
    { id: 'slots', label: '🕐 Add Slots' },
    { id: 'analytics', label: '📊 Analytics' },
];

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('tokens');
    const today = format(new Date(), 'yyyy-MM-dd');

    // ── Tokens tab state ─────────────────────────────────────────────────────
    const [tokens, setTokens] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [deptFilter, setDeptFilter] = useState('all');
    const [dataError, setDataError] = useState(null);  // Firestore error message
    const [deptLoading, setDeptLoading] = useState(true);

    // ── Departments tab state ────────────────────────────────────────────────
    const [deptForm, setDeptForm] = useState({ department_name: '', office_location: '' });
    const [savingDept, setSavingDept] = useState(false);
    // In-app confirm modal (replaces window.confirm which Vite HMR steals focus from)
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
    const showConfirm = (title, message, onConfirm) => setConfirmModal({ show: true, title, message, onConfirm });
    const closeConfirm = () => setConfirmModal({ show: false, title: '', message: '', onConfirm: null });

    // ── Slots tab state ──────────────────────────────────────────────────────
    const [slotDept, setSlotDept] = useState('');
    const [slotDate, setSlotDate] = useState(today);
    const [slotMax, setSlotMax] = useState(10);
    const [addingSlots, setAddingSlots] = useState(false);
    const [existingSlots, setExistingSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // ── Analytics tab state ──────────────────────────────────────────────────
    const [analytics, setAnalytics] = useState([]);

    // Load departments once
    useEffect(() => {
        setDeptLoading(true);
        getDepartments(false)
            .then(d => {
                setDepartments(d);
                if (d.length > 0) setSlotDept(d[0].id);
                setDataError(null);
            })
            .catch(err => {
                const msg = err.code === 'permission-denied'
                    ? 'Firestore permissions denied. Update your Firestore security rules — see the red banner for instructions.'
                    : 'Failed to load departments: ' + (err.code || err.message);
                setDataError(msg);
                toast.error('Cannot load data — check Firestore rules');
            })
            .finally(() => setDeptLoading(false));
    }, []);

    // Live token subscription
    useEffect(() => {
        const constraints = [where('booking_date', '==', today)];
        if (deptFilter !== 'all') constraints.push(where('department_id', '==', deptFilter));
        const q = query(collection(db, 'tokens'), ...constraints);
        const unsub = onSnapshot(
            q,
            snap => {
                const ts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
                setTokens(ts);
                setDataError(null);
            },
            err => {
                if (err.code === 'permission-denied') {
                    setDataError('Firestore \'permission-denied\': Your security rules are blocking reads. Fix your rules in Firebase Console.');
                } else {
                    setDataError('Token subscription error: ' + err.message);
                }
            }
        );
        return unsub;
    }, [deptFilter, today]);

    // Load analytics
    useEffect(() => {
        if (activeTab !== 'analytics') return;
        const load = async () => {
            const start = format(subDays(new Date(), 6), 'yyyy-MM-dd');
            const q = query(collection(db, 'tokens'),
                where('booking_date', '>=', start), where('booking_date', '<=', today));
            const snap = await getDocs(q);
            const map = {};
            snap.docs.forEach(d => {
                const t = d.data();
                if (!map[t.booking_date]) map[t.booking_date] = { date: t.booking_date, total: 0, completed: 0, cancelled: 0, pending: 0 };
                map[t.booking_date].total++;
                if (t.status) map[t.booking_date][t.status] = (map[t.booking_date][t.status] || 0) + 1;
            });
            setAnalytics(Object.values(map).sort((a, b) => a.date.localeCompare(b.date)));
        };
        load().catch(() => { });
    }, [activeTab]);

    // Load existing slots when dept/date changes on slots tab
    useEffect(() => {
        if (activeTab !== 'slots' || !slotDept || !slotDate) return;
        setLoadingSlots(true);
        const q = query(collection(db, 'slots'),
            where('department_id', '==', slotDept),
            where('date', '==', slotDate));
        getDocs(q).then(snap => {
            setExistingSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.slot_time.localeCompare(b.slot_time)));
        }).finally(() => setLoadingSlots(false));
    }, [slotDept, slotDate, activeTab]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleCleanReseed = async () => {
        showConfirm(
            'Clean & Re-seed Departments',
            'This will DELETE all existing departments and re-seed 7 standard Tamil Nadu departments with sub-divisions. Existing slots linked to old departments will become orphaned. Continue?',
            async () => {
                setSavingDept(true);
                try {
                    // Delete all existing departments
                    const snap = await getDocs(collection(db, 'departments'));
                    const batch = writeBatch(db);
                    snap.docs.forEach(d => batch.delete(d.ref));
                    await batch.commit();

                    // Re-seed fresh departments
                    const newDepts = [];
                    for (const dept of FRESH_DEPARTMENTS) {
                        const ref = await addDoc(collection(db, 'departments'), { ...dept, isActive: true, createdAt: serverTimestamp() });
                        newDepts.push({ id: ref.id, ...dept, isActive: true });
                    }
                    setDepartments(newDepts);
                    toast.success(`✅ Cleaned & re-seeded ${newDepts.length} departments!`);
                } catch (err) {
                    toast.error('Failed: ' + err.message);
                } finally {
                    setSavingDept(false);
                }
            });
    };

    const handleStatus = async (token, status) => {
        try {
            await updateTokenStatus(token.id, status);
            toast.success(`${token.token_number} → ${status}`);
        } catch { toast.error('Update failed'); }
    };

    const handleAddDept = async (e) => {
        e.preventDefault();
        if (!deptForm.department_name || !deptForm.office_location) { toast.error('Fill all fields'); return; }
        setSavingDept(true);
        try {
            const ref = await addDoc(collection(db, 'departments'), { ...deptForm, isActive: true, createdAt: serverTimestamp() });
            setDepartments(prev => [...prev, { id: ref.id, ...deptForm, isActive: true }]);
            setDeptForm({ department_name: '', office_location: '' });
            toast.success('Department added!');
        } catch { toast.error('Failed to add department'); }
        finally { setSavingDept(false); }
    };

    const handleToggleDept = async (dept) => {
        try {
            await updateDoc(doc(db, 'departments', dept.id), { isActive: !dept.isActive });
            setDepartments(prev => prev.map(d => d.id === dept.id ? { ...d, isActive: !d.isActive } : d));
            toast.success(dept.isActive ? 'Deactivated' : 'Activated');
        } catch { toast.error('Update failed'); }
    };

    const handleDeleteDept = async (id) => {
        showConfirm(
            'Delete Department',
            'Are you sure you want to delete this department? This cannot be undone.',
            async () => {
                try {
                    await deleteDoc(doc(db, 'departments', id));
                    setDepartments(prev => prev.filter(d => d.id !== id));
                    toast.success('Deleted');
                } catch { toast.error('Delete failed'); }
            }
        );
    };

    const handleAddSlots = async () => {
        if (!slotDept || !slotDate) { toast.error('Select department and date'); return; }
        setAddingSlots(true);
        try {
            let added = 0;
            for (const slot_time of SLOT_TIMES) {
                const already = existingSlots.some(s => s.slot_time === slot_time);
                if (!already) {
                    await addDoc(collection(db, 'slots'), {
                        department_id: slotDept, date: slotDate, slot_time,
                        max_tokens: Number(slotMax), booked_count: 0, isBlocked: false, createdAt: serverTimestamp(),
                    });
                    added++;
                }
            }
            toast.success(`Added ${added} new slots (${SLOT_TIMES.length - added} already existed)`);
            // Refresh
            const q = query(collection(db, 'slots'), where('department_id', '==', slotDept), where('date', '==', slotDate));
            const snap = await getDocs(q);
            setExistingSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.slot_time.localeCompare(b.slot_time)));
        } catch (err) { toast.error('Failed: ' + err.message); }
        finally { setAddingSlots(false); }
    };

    const handleDeleteSlot = async (slotId) => {
        try {
            await deleteDoc(doc(db, 'slots', slotId));
            setExistingSlots(prev => prev.filter(s => s.id !== slotId));
            toast.success('Slot removed');
        } catch { toast.error('Delete failed'); }
    };

    const handleBulkSlots = async () => {
        if (!slotDept) { toast.error('Select a department first'); return; }
        setAddingSlots(true);
        let total = 0;
        try {
            // Next 7 weekdays
            const dates = [];
            const d = new Date();
            while (dates.length < 7) {
                const day = d.getDay();
                if (day !== 0 && day !== 6) {
                    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
                    dates.push(`${y}-${m}-${dd}`);
                }
                d.setDate(d.getDate() + 1);
            }
            for (const date of dates) {
                for (const slot_time of SLOT_TIMES) {
                    await addDoc(collection(db, 'slots'), {
                        department_id: slotDept, date, slot_time,
                        max_tokens: Number(slotMax), booked_count: 0, isBlocked: false, createdAt: serverTimestamp(),
                    });
                    total++;
                }
            }
            toast.success(`Created ${total} slots for next 7 weekdays!`);
        } catch (err) { toast.error('Bulk add failed: ' + err.message); }
        finally { setAddingSlots(false); }
    };

    // Stats
    const stats = {
        total: tokens.length,
        pending: tokens.filter(t => t.status === 'pending').length,
        called: tokens.filter(t => t.status === 'called').length,
        completed: tokens.filter(t => t.status === 'completed').length,
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gov-navy">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
                </div>
                <div className="flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-3 py-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-700 text-xs font-bold">LIVE</span>
                </div>
            </div>

            {/* ── Firestore Rules Error Banner ────────────────────────────────── */}
            {dataError && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <p className="font-bold text-red-800 text-sm mb-1">⚠️ Data Load Failed — Firestore Rules Issue</p>
                            <p className="text-red-700 text-xs mb-3 font-mono bg-red-100 rounded-lg px-3 py-2">{dataError}</p>
                            <p className="text-red-700 text-sm font-semibold mb-2">Fix in 3 steps:</p>
                            <ol className="text-red-700 text-sm space-y-1 list-decimal list-inside">
                                <li>Open <strong>Firebase Console</strong> → your project → <strong>Firestore Database</strong> → <strong>Rules</strong> tab</li>
                                <li>Replace the entire rules content with the content from <code className="bg-red-100 px-1 rounded">firestore.rules</code> in your project root</li>
                                <li>Click <strong>Publish</strong> → then refresh this page</li>
                            </ol>
                            <div className="mt-3 bg-red-100 rounded-xl p-3 font-mono text-xs text-red-800 whitespace-pre">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}</div>
                            <p className="text-red-500 text-xs mt-2">↑ Quick-fix rules (auth required). Use <code>firestore.rules</code> for production-grade rules.</p>
                        </div>
                        <button onClick={() => setDataError(null)} className="text-red-400 hover:text-red-600 text-lg font-bold shrink-0">✕</button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-gov-navy text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gov-blue'
                            }`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: LIVE TOKENS ─────────────────────────────────────────────── */}
            {activeTab === 'tokens' && (
                <div>
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Today Total', value: stats.total, color: 'text-gov-blue' },
                            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
                            { label: 'Called', value: stats.called, color: 'text-blue-600' },
                            { label: 'Completed', value: stats.completed, color: 'text-green-600' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                                <p className="text-gray-500 text-sm mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Department filter */}
                    <div className="flex gap-2 flex-wrap mb-5">
                        <button onClick={() => setDeptFilter('all')}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${deptFilter === 'all' ? 'bg-gov-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gov-blue'}`}>
                            All Departments
                        </button>
                        {departments.map(d => (
                            <button key={d.id} onClick={() => setDeptFilter(d.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${deptFilter === d.id ? 'bg-gov-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gov-blue'}`}>
                                {d.department_name}
                            </button>
                        ))}
                    </div>

                    {/* Token table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gov-light border-b border-gray-100 text-left">
                                        {['Token', 'Citizen', 'Department', 'Slot', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {tokens.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No bookings for today yet.</td></tr>
                                    ) : tokens.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5"><span className="font-bold text-gov-blue">{t.token_number}</span></td>
                                            <td className="px-5 py-3.5 text-gov-navy text-sm font-medium">{t.user_name}</td>
                                            <td className="px-5 py-3.5 text-gray-600 text-sm">{t.department_name}</td>
                                            <td className="px-5 py-3.5 text-gray-500 text-sm">{t.slot_time}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusBadge[t.status]}`}>{t.status}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {t.status === 'pending' && (
                                                        <button onClick={() => handleStatus(t, 'called')}
                                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors font-medium">
                                                            📢 Call
                                                        </button>
                                                    )}
                                                    {(t.status === 'pending' || t.status === 'called') && (
                                                        <button onClick={() => handleStatus(t, 'completed')}
                                                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors font-medium">
                                                            ✅ Done
                                                        </button>
                                                    )}
                                                    {t.status === 'pending' && (
                                                        <button onClick={() => handleStatus(t, 'cancelled')}
                                                            className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors font-medium">
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: DEPARTMENTS ─────────────────────────────────────────────── */}
            {activeTab === 'departments' && (
                <div className="grid lg:grid-cols-3 gap-6">
                    <div>
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h2 className="font-bold text-gov-navy mb-4">Add Department</h2>
                            <form onSubmit={handleAddDept} className="space-y-3">
                                <input type="text" value={deptForm.department_name}
                                    onChange={e => setDeptForm(p => ({ ...p, department_name: e.target.value }))}
                                    placeholder="Department Name" required
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue" />
                                <input type="text" value={deptForm.office_location}
                                    onChange={e => setDeptForm(p => ({ ...p, office_location: e.target.value }))}
                                    placeholder="Office Location (full address)" required
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue" />
                                <button type="submit" disabled={savingDept}
                                    className="w-full bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                                    {savingDept ? 'Adding...' : '+ Add Department'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
                                <h2 className="font-bold text-gov-navy">All Departments ({departments.length})</h2>
                                <button onClick={handleCleanReseed} disabled={savingDept}
                                    className="text-xs bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-1.5 rounded-lg font-medium transition-colors">
                                    {savingDept ? '⏳ Working...' : '🧹 Clean & Re-seed Departments'}
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {departments.map(d => (
                                    <div key={d.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                                        <div>
                                            <p className="font-medium text-gov-navy text-sm">{d.department_name}</p>
                                            <p className="text-gray-400 text-xs mt-0.5">📍 {d.office_location}</p>
                                            {d.subdivisions?.length > 0 && (
                                                <p className="text-blue-400 text-xs mt-0.5">{d.subdivisions.length} services</p>
                                            )}
                                            <span className={`text-xs font-medium ${d.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                                {d.isActive ? '● Active' : '○ Inactive'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleToggleDept(d)}
                                                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${d.isActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                                {d.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button onClick={() => handleDeleteDept(d.id)}
                                                className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg font-medium transition-colors">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {departments.length === 0 && (
                                    <div className="text-center py-10 text-gray-400 text-sm">No departments yet. Add one.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: ADD SLOTS ───────────────────────────────────────────────── */}
            {activeTab === 'slots' && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="font-bold text-gov-navy mb-5">Add Slots</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                                <select value={slotDept} onChange={e => setSlotDept(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue">
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                                <input type="date" value={slotDate} min={today}
                                    onChange={e => setSlotDate(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Tokens per Slot</label>
                                <input type="number" value={slotMax} min={1} max={100}
                                    onChange={e => setSlotMax(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={handleAddSlots} disabled={addingSlots}
                                    className="flex-1 bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                                    {addingSlots ? 'Adding...' : '+ Add Slots for this Date'}
                                </button>
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs text-gray-500 mb-3">Or add slots for the next 7 weekdays at once:</p>
                                <button onClick={handleBulkSlots} disabled={addingSlots}
                                    className="w-full bg-gov-gold hover:bg-amber-500 disabled:bg-gray-300 text-gov-navy text-sm font-bold py-2.5 rounded-xl transition-colors">
                                    {addingSlots ? 'Working...' : '🚀 Bulk: Add 7 Weekdays of Slots'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50">
                            <h2 className="font-bold text-gov-navy">
                                Existing Slots — {slotDate}
                            </h2>
                            <p className="text-gray-400 text-xs mt-0.5">{existingSlots.length} slots</p>
                        </div>
                        {loadingSlots ? (
                            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                                <div className="w-4 h-4 border-2 border-gov-blue border-t-transparent rounded-full animate-spin" /> Loading...
                            </div>
                        ) : existingSlots.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm">No slots for this date.</div>
                        ) : (
                            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                                {existingSlots.map(s => (
                                    <div key={s.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50">
                                        <div>
                                            <p className="text-sm font-medium text-gov-navy">{s.slot_time}</p>
                                            <p className="text-xs text-gray-400">{s.booked_count}/{s.max_tokens} booked</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {s.isBlocked ? 'Blocked' : 'Open'}
                                            </span>
                                            <button onClick={() => handleDeleteSlot(s.id)}
                                                className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded transition-colors">✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: ANALYTICS ───────────────────────────────────────────────── */}
            {activeTab === 'analytics' && (
                <div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total (7d)', value: analytics.reduce((s, d) => s + d.total, 0), color: 'text-gov-blue' },
                            { label: 'Completed', value: analytics.reduce((s, d) => s + (d.completed || 0), 0), color: 'text-green-600' },
                            { label: 'Cancelled', value: analytics.reduce((s, d) => s + (d.cancelled || 0), 0), color: 'text-red-600' },
                            { label: 'Departments', value: departments.length, color: 'text-purple-600' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                                <p className="text-gray-500 text-sm mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {analytics.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h2 className="font-bold text-gov-navy mb-4">Last 7 Days — Daily Bookings</h2>
                            <ResponsiveContainer width="100%" height={280}>
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
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 shadow-sm">
                            <p className="text-4xl mb-2">📊</p>
                            <p>No booking data in the last 7 days.</p>
                        </div>
                    )}
                </div>
            )}
            {/* ── In-App Confirm Modal (replaces window.confirm) ──────────────── */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 max-w-md w-full animate-slide-up">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-red-600 text-lg">⚠️</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gov-navy text-base">{confirmModal.title}</h3>
                                <p className="text-gray-500 text-sm mt-1">{confirmModal.message}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={closeConfirm}
                                className="px-5 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => { confirmModal.onConfirm?.(); closeConfirm(); }}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors">
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
