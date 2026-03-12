import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getDepartments, updateTokenStatus, callNextToken } from '../firebase/firestore';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Ticket, Megaphone, CheckCircle, XCircle, ClipboardList, Building2, BarChart3, Clock, Monitor, Trash2, Loader2, X, Rocket, AlertTriangle, MapPin, Radio } from 'lucide-react';
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
const SLOT_TIMES = ['09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM', '10:30 AM - 11:00 AM', '11:00 AM - 11:30 AM', '11:30 AM - 12:00 PM', '02:00 PM - 02:30 PM', '02:30 PM - 03:00 PM', '03:00 PM - 03:30 PM'];
const statusBadge = { pending: { bg: '#fffbeb', c: '#92400e', b: '#fde68a' }, called: { bg: '#eff6ff', c: '#1e40af', b: '#bfdbfe' }, completed: { bg: '#ecfdf5', c: '#065f46', b: '#a7f3d0' }, cancelled: { bg: '#fef2f2', c: '#991b1b', b: '#fecaca' } };
const tabDef = [{ id: 'tokens', label: 'Live Tokens', icon: <Ticket size={15} /> }, { id: 'departments', label: 'Departments', icon: <Building2 size={15} /> }, { id: 'slots', label: 'Add Slots', icon: <Clock size={15} /> }, { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} /> }];

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('tokens');
    const today = format(new Date(), 'yyyy-MM-dd');
    const [tokens, setTokens] = useState([]); const [departments, setDepartments] = useState([]); const [deptFilter, setDeptFilter] = useState('all'); const [dataError, setDataError] = useState(null); const [callingNext, setCallingNext] = useState(false); const [deptLoading, setDeptLoading] = useState(true); const [callPulse, setCallPulse] = useState(false);
    const [deptForm, setDeptForm] = useState({ department_name: '', office_location: '' }); const [savingDept, setSavingDept] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
    const showConfirm = (t, m, fn) => setConfirmModal({ show: true, title: t, message: m, onConfirm: fn });
    const closeConfirm = () => setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
    const [slotDept, setSlotDept] = useState(''); const [slotDate, setSlotDate] = useState(today); const [slotMax, setSlotMax] = useState(10); const [addingSlots, setAddingSlots] = useState(false); const [existingSlots, setExistingSlots] = useState([]); const [loadingSlots, setLoadingSlots] = useState(false);
    const [analytics, setAnalytics] = useState([]);

    useEffect(() => { setDeptLoading(true); getDepartments(false).then(d => { setDepartments(d); if (d.length > 0) setSlotDept(d[0].id); setDataError(null); }).catch(e => { setDataError(e.code === 'permission-denied' ? 'Firestore permissions denied.' : 'Failed: ' + (e.code || e.message)); toast.error('Cannot load data'); }).finally(() => setDeptLoading(false)); }, []);
    useEffect(() => { const c = [where('booking_date', '==', today)]; if (deptFilter !== 'all') c.push(where('department_id', '==', deptFilter)); return onSnapshot(query(collection(db, 'tokens'), ...c), s => { setTokens(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))); setDataError(null); }, e => setDataError(e.message)); }, [deptFilter, today]);
    useEffect(() => { if (activeTab !== 'analytics') return; (async () => { const s = format(subDays(new Date(), 6), 'yyyy-MM-dd'); const snap = await getDocs(query(collection(db, 'tokens'), where('booking_date', '>=', s), where('booking_date', '<=', today))); const m = {}; snap.docs.forEach(d => { const t = d.data(); if (!m[t.booking_date]) m[t.booking_date] = { date: t.booking_date, total: 0, completed: 0, cancelled: 0, pending: 0 }; m[t.booking_date].total++; if (t.status) m[t.booking_date][t.status] = (m[t.booking_date][t.status] || 0) + 1; }); setAnalytics(Object.values(m).sort((a, b) => a.date.localeCompare(b.date))); })().catch(() => { }); }, [activeTab]);
    useEffect(() => { if (activeTab !== 'slots' || !slotDept || !slotDate) return; setLoadingSlots(true); getDocs(query(collection(db, 'slots'), where('department_id', '==', slotDept), where('date', '==', slotDate))).then(s => setExistingSlots(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.slot_time.localeCompare(b.slot_time)))).finally(() => setLoadingSlots(false)); }, [slotDept, slotDate, activeTab]);

    const handleCleanReseed = () => showConfirm('Clean & Re-seed', 'Delete all departments and re-seed 7 standard ones?', async () => { setSavingDept(true); try { const s = await getDocs(collection(db, 'departments')); const b = writeBatch(db); s.docs.forEach(d => b.delete(d.ref)); await b.commit(); const n = []; for (const dept of FRESH_DEPARTMENTS) { const r = await addDoc(collection(db, 'departments'), { ...dept, isActive: true, createdAt: serverTimestamp() }); n.push({ id: r.id, ...dept, isActive: true }); } setDepartments(n); toast.success(`Re-seeded ${n.length}!`); } catch (e) { toast.error('Failed: ' + e.message); } finally { setSavingDept(false); } });
    const handleStatus = async (t, s) => { try { await updateTokenStatus(t.id, s); toast.success(`${t.token_number} → ${s}`); } catch { toast.error('Failed'); } };
    const handleCallNext = async () => { setCallingNext(true); try { const r = await callNextToken(today, deptFilter !== 'all' ? deptFilter : null); if (r) { toast.success(`Called: ${r.token_number}`); setCallPulse(true); setTimeout(() => setCallPulse(false), 1500); } else toast.error('No pending tokens'); } catch { toast.error('Failed'); } finally { setCallingNext(false); } };
    const handleAddDept = async (e) => { e.preventDefault(); if (!deptForm.department_name || !deptForm.office_location) { toast.error('Fill all'); return; } setSavingDept(true); try { const r = await addDoc(collection(db, 'departments'), { ...deptForm, isActive: true, createdAt: serverTimestamp() }); setDepartments(p => [...p, { id: r.id, ...deptForm, isActive: true }]); setDeptForm({ department_name: '', office_location: '' }); toast.success('Added!'); } catch { toast.error('Failed'); } finally { setSavingDept(false); } };
    const handleToggleDept = async (d) => { try { await updateDoc(doc(db, 'departments', d.id), { isActive: !d.isActive }); setDepartments(p => p.map(x => x.id === d.id ? { ...x, isActive: !x.isActive } : x)); toast.success(d.isActive ? 'Deactivated' : 'Activated'); } catch { toast.error('Failed'); } };
    const handleDeleteDept = (id) => showConfirm('Delete Department', 'Cannot be undone.', async () => { try { await deleteDoc(doc(db, 'departments', id)); setDepartments(p => p.filter(d => d.id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); } });
    const handleAddSlots = async () => { if (!slotDept || !slotDate) { toast.error('Select dept & date'); return; } setAddingSlots(true); try { let a = 0; for (const t of SLOT_TIMES) { if (!existingSlots.some(s => s.slot_time === t)) { await addDoc(collection(db, 'slots'), { department_id: slotDept, date: slotDate, slot_time: t, max_tokens: Number(slotMax), booked_count: 0, isBlocked: false, createdAt: serverTimestamp() }); a++; } } toast.success(`Added ${a} slots`); const q = query(collection(db, 'slots'), where('department_id', '==', slotDept), where('date', '==', slotDate)); const s = await getDocs(q); setExistingSlots(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.slot_time.localeCompare(b.slot_time))); } catch (e) { toast.error('Failed: ' + e.message); } finally { setAddingSlots(false); } };
    const handleDeleteSlot = async (id) => { try { await deleteDoc(doc(db, 'slots', id)); setExistingSlots(p => p.filter(s => s.id !== id)); toast.success('Removed'); } catch { toast.error('Failed'); } };
    const handleBulkSlots = async () => { if (!slotDept) { toast.error('Select dept'); return; } setAddingSlots(true); let t = 0; try { const ds = []; const d = new Date(); while (ds.length < 7) { if (d.getDay() !== 0 && d.getDay() !== 6) ds.push(format(d, 'yyyy-MM-dd')); d.setDate(d.getDate() + 1); } for (const dt of ds) for (const st of SLOT_TIMES) { await addDoc(collection(db, 'slots'), { department_id: slotDept, date: dt, slot_time: st, max_tokens: Number(slotMax), booked_count: 0, isBlocked: false, createdAt: serverTimestamp() }); t++; } toast.success(`Created ${t} slots!`); } catch (e) { toast.error('Failed: ' + e.message); } finally { setAddingSlots(false); } };

    const stats = { total: tokens.length, pending: tokens.filter(t => t.status === 'pending').length, called: tokens.filter(t => t.status === 'called').length, completed: tokens.filter(t => t.status === 'completed').length };
    const currentCalledToken = tokens.filter(t => t.status === 'called').sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0))[0] || null;
    const progressPct = stats.total > 0 ? Math.round(((stats.completed + stats.called) / stats.total) * 100) : 0;
    const inputStyle = { backgroundColor: '#f0ede6', border: '1px solid #d4ddd0', color: '#1c1917' };
    const cardStyle = { backgroundColor: '#ffffff', border: '1px solid #d4ddd0' };

    return (
        <div style={{ backgroundColor: '#f0ede6', minHeight: '100vh' }}>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div><h1 className="text-2xl font-bold" style={{ color: '#1c1917' }}>Admin Dashboard</h1><p className="text-sm mt-0.5" style={{ color: '#9c978f' }}>{format(new Date(), 'EEEE, dd MMMM yyyy')}</p></div>
                    <div className="flex items-center gap-3">
                        <a href="/live" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors" style={{ backgroundColor: '#f0ede6', border: '1px solid #d4ddd0', color: '#6b6860' }}><Monitor size={14} /> Live Display</a>
                        <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}><Radio size={10} className="text-emerald-500 animate-pulse" /><span className="text-emerald-700 text-xs font-bold">LIVE</span></div>
                    </div>
                </div>
                {dataError && <div className="mb-6 rounded-3xl p-5 flex items-start gap-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}><AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} /><p className="text-sm" style={{ color: '#991b1b' }}>{dataError}</p></div>}

                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {tabDef.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5"
                            style={activeTab === tab.id ? { backgroundColor: '#ffffff', color: '#1c1917', border: '1px solid #d4ddd0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } : { backgroundColor: 'transparent', color: '#6b6860', border: '1px solid #d4ddd0' }}>{tab.icon} {tab.label}</button>
                    ))}
                </div>

                {/* TOKENS */}
                {activeTab === 'tokens' && (<div>
                    <div className="grid md:grid-cols-5 gap-4 mb-6">
                        <div className={`md:col-span-3 rounded-3xl p-6 sm:p-8 transition-all duration-500 ${callPulse ? 'ring-2 ring-orange-300' : ''}`} style={cardStyle}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2"><Radio size={10} className="text-red-500 animate-pulse" /><p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: '#d4613a' }}>Now Serving</p></div>
                                <span className="text-xs" style={{ color: '#9c978f' }}>{format(new Date(), 'hh:mm a')}</span>
                            </div>
                            {currentCalledToken ? (<div>
                                <p className={`text-5xl sm:text-6xl font-bold leading-none transition-all duration-500 ${callPulse ? 'scale-[1.03]' : 'scale-100'}`} style={{ color: '#1c1917' }}>{currentCalledToken.token_number}</p>
                                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
                                    <div><p className="text-xs" style={{ color: '#9c978f' }}>Citizen</p><p className="font-medium text-sm" style={{ color: '#1c1917' }}>{currentCalledToken.user_name}</p></div>
                                    <div><p className="text-xs" style={{ color: '#9c978f' }}>Department</p><p className="font-medium text-sm" style={{ color: '#1c1917' }}>{currentCalledToken.department_name}</p></div>
                                    <div><p className="text-xs" style={{ color: '#9c978f' }}>Slot</p><p className="font-medium text-sm" style={{ color: '#1c1917' }}>{currentCalledToken.slot_time}</p></div>
                                </div>
                            </div>) : (<div><p className="text-5xl sm:text-6xl font-bold leading-none" style={{ color: '#d4ddd0' }}>– – –</p><p className="text-sm mt-4" style={{ color: '#9c978f' }}>No token called yet</p></div>)}
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-4">
                            <button onClick={handleCallNext} disabled={callingNext || stats.pending === 0} className="flex-1 min-h-[160px] rounded-3xl shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-200 flex flex-col items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#1c1917', color: '#fff' }}>
                                {callingNext ? <Loader2 size={48} className="animate-spin" /> : <Megaphone size={48} className="group-hover:scale-110 transition-transform" />}
                                <span className="text-lg sm:text-xl font-bold">{callingNext ? 'Calling...' : 'Call Next Token'}</span>
                                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{stats.pending} pending</span>
                            </button>
                            <div className="rounded-3xl p-4" style={cardStyle}>
                                <div className="flex items-center justify-between text-xs mb-2"><span style={{ color: '#9c978f' }}>Today's Progress</span><span className="font-bold" style={{ color: '#1c1917' }}>{progressPct}%</span></div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ede6' }}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, backgroundColor: '#d4613a' }} /></div>
                                <div className="flex items-center justify-between text-xs mt-2" style={{ color: '#9c978f' }}><span>{stats.completed} done</span><span>{stats.total} total</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {[{ l: 'Today Total', v: stats.total, icon: <ClipboardList size={18} /> }, { l: 'Pending', v: stats.pending, icon: <Loader2 size={18} /> }, { l: 'Called', v: stats.called, icon: <Megaphone size={18} /> }, { l: 'Completed', v: stats.completed, icon: <CheckCircle size={18} /> }].map(s => (
                            <div key={s.l} className="rounded-3xl p-4" style={cardStyle}><div className="flex items-center justify-between mb-2"><span style={{ color: '#d4613a' }}>{s.icon}</span><span className="text-xs" style={{ color: '#9c978f' }}>{s.l}</span></div><p className="text-3xl font-extrabold" style={{ color: '#1c1917' }}>{s.v}</p></div>
                        ))}
                    </div>
                    <div className="flex gap-2 flex-wrap mb-5">
                        <button onClick={() => setDeptFilter('all')} className="px-4 py-1.5 rounded-full text-sm font-medium transition-all" style={deptFilter === 'all' ? { backgroundColor: '#ffffff', color: '#1c1917', border: '1px solid #d4ddd0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } : { color: '#6b6860', border: '1px solid #d4ddd0' }}>All Departments</button>
                        {departments.map(d => <button key={d.id} onClick={() => setDeptFilter(d.id)} className="px-4 py-1.5 rounded-full text-sm font-medium transition-all" style={deptFilter === d.id ? { backgroundColor: '#ffffff', color: '#1c1917', border: '1px solid #d4ddd0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } : { color: '#6b6860', border: '1px solid #d4ddd0' }}>{d.department_name}</button>)}
                    </div>
                    <div className="rounded-3xl overflow-hidden" style={cardStyle}>
                        <div className="overflow-x-auto"><table className="w-full"><thead><tr style={{ borderBottom: '1px solid #d4ddd0' }}>{['Token', 'Citizen', 'Department', 'Slot', 'Status', 'Actions'].map(h => <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-left" style={{ color: '#9c978f' }}>{h}</th>)}</tr></thead>
                            <tbody>{tokens.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: '#9c978f' }}>No bookings for today yet.</td></tr> : tokens.map(t => {
                                const sb = statusBadge[t.status] || statusBadge.pending; return (
                                    <tr key={t.id} style={{ borderBottom: '1px solid #e8ede5', backgroundColor: t.status === 'called' ? '#f8f6f1' : 'transparent' }}>
                                        <td className="px-5 py-3.5"><span className="font-bold" style={{ color: t.status === 'called' ? '#d4613a' : '#1c1917' }}>{t.token_number}{currentCalledToken?.id === t.id && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212,97,58,0.1)', color: '#d4613a' }}><Radio size={8} className="animate-pulse" />LIVE</span>}</span></td>
                                        <td className="px-5 py-3.5 text-sm font-medium" style={{ color: '#1c1917' }}>{t.user_name}</td>
                                        <td className="px-5 py-3.5 text-sm" style={{ color: '#6b6860' }}>{t.department_name}</td>
                                        <td className="px-5 py-3.5 text-sm" style={{ color: '#9c978f' }}>{t.slot_time}</td>
                                        <td className="px-5 py-3.5"><span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: sb.bg, color: sb.c, border: `1px solid ${sb.b}` }}>{t.status}</span></td>
                                        <td className="px-5 py-3.5"><div className="flex gap-1.5 flex-wrap">
                                            {t.status === 'pending' && <button onClick={() => handleStatus(t, 'called')} className="text-xs px-3 py-1 rounded-full font-medium text-white flex items-center gap-1" style={{ backgroundColor: '#1c1917' }}><Megaphone size={12} /> Call</button>}
                                            {(t.status === 'pending' || t.status === 'called') && <button onClick={() => handleStatus(t, 'completed')} className="text-xs px-3 py-1 rounded-full font-medium text-white flex items-center gap-1" style={{ backgroundColor: '#059669' }}><CheckCircle size={12} /> Done</button>}
                                            {t.status === 'pending' && <button onClick={() => handleStatus(t, 'cancelled')} className="text-xs px-3 py-1 rounded-full font-medium" style={{ color: '#dc2626', border: '1px solid #fecaca' }}><X size={12} /></button>}
                                        </div></td>
                                    </tr>);
                            })}</tbody></table></div>
                    </div>
                </div>)}

                {/* DEPARTMENTS */}
                {activeTab === 'departments' && (<div className="grid lg:grid-cols-3 gap-5">
                    <div><div className="rounded-3xl p-5" style={cardStyle}><h2 className="text-lg font-bold mb-4" style={{ color: '#1c1917' }}>Add Department</h2>
                        <form onSubmit={handleAddDept} className="space-y-3">
                            <input type="text" value={deptForm.department_name} onChange={e => setDeptForm(p => ({ ...p, department_name: e.target.value }))} placeholder="Department Name" required className="w-full px-3 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 placeholder:text-[#9c978f]" style={inputStyle} />
                            <input type="text" value={deptForm.office_location} onChange={e => setDeptForm(p => ({ ...p, office_location: e.target.value }))} placeholder="Office Location" required className="w-full px-3 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 placeholder:text-[#9c978f]" style={inputStyle} />
                            <button type="submit" disabled={savingDept} className="w-full text-white text-sm font-semibold py-2.5 rounded-full disabled:opacity-50" style={{ backgroundColor: '#1c1917' }}>{savingDept ? 'Adding...' : '+ Add Department'}</button>
                        </form></div></div>
                    <div className="lg:col-span-2"><div className="rounded-3xl overflow-hidden" style={cardStyle}>
                        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: '1px solid #d4ddd0' }}>
                            <h2 className="font-bold" style={{ color: '#1c1917' }}>All Departments ({departments.length})</h2>
                            <button onClick={handleCleanReseed} disabled={savingDept} className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 disabled:opacity-40" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}><Trash2 size={12} />{savingDept ? 'Working...' : 'Clean & Re-seed'}</button>
                        </div>
                        <div>{departments.map(d => (<div key={d.id} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #e8ede5' }}>
                            <div><p className="font-medium text-sm" style={{ color: '#1c1917' }}>{d.department_name}</p><p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#9c978f' }}><MapPin size={11} /> {d.office_location}</p>{d.subdivisions?.length > 0 && <p className="text-xs mt-0.5" style={{ color: '#d4613a' }}>{d.subdivisions.length} services</p>}<span className="text-xs font-medium" style={{ color: d.isActive ? '#059669' : '#9c978f' }}>{d.isActive ? 'Active' : 'Inactive'}</span></div>
                            <div className="flex gap-2">
                                <button onClick={() => handleToggleDept(d)} className="text-xs px-3 py-1 rounded-full font-medium" style={d.isActive ? { backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' } : { backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>{d.isActive ? 'Deactivate' : 'Activate'}</button>
                                <button onClick={() => handleDeleteDept(d.id)} className="text-xs px-3 py-1 rounded-full font-medium" style={{ color: '#dc2626', border: '1px solid #fecaca' }}>Delete</button>
                            </div></div>))}{departments.length === 0 && <div className="text-center py-10 text-sm" style={{ color: '#9c978f' }}>No departments yet.</div>}</div>
                    </div></div>
                </div>)}

                {/* SLOTS */}
                {activeTab === 'slots' && (<div className="grid lg:grid-cols-2 gap-5">
                    <div className="rounded-3xl p-6" style={cardStyle}><h2 className="text-lg font-bold mb-5" style={{ color: '#1c1917' }}>Add Slots</h2>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1.5" style={{ color: '#6b6860' }}>Department</label><select value={slotDept} onChange={e => setSlotDept(e.target.value)} className="w-full px-3 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" style={inputStyle}>{departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}</select></div>
                            <div><label className="block text-sm font-medium mb-1.5" style={{ color: '#6b6860' }}>Date</label><input type="date" value={slotDate} min={today} onChange={e => setSlotDate(e.target.value)} className="w-full px-3 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" style={inputStyle} /></div>
                            <div><label className="block text-sm font-medium mb-1.5" style={{ color: '#6b6860' }}>Max Tokens per Slot</label><input type="number" value={slotMax} min={1} max={100} onChange={e => setSlotMax(e.target.value)} className="w-full px-3 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" style={inputStyle} /></div>
                            <button onClick={handleAddSlots} disabled={addingSlots} className="w-full text-white text-sm font-semibold py-2.5 rounded-full disabled:opacity-50" style={{ backgroundColor: '#1c1917' }}>{addingSlots ? 'Adding...' : '+ Add Slots for this Date'}</button>
                            <div className="pt-4" style={{ borderTop: '1px solid #d4ddd0' }}><p className="text-xs mb-3" style={{ color: '#9c978f' }}>Or add for next 7 weekdays:</p>
                                <button onClick={handleBulkSlots} disabled={addingSlots} className="w-full text-white text-sm font-bold py-2.5 rounded-full disabled:opacity-50 flex items-center justify-center gap-1.5" style={{ backgroundColor: '#d4613a' }}><Rocket size={14} />{addingSlots ? 'Working...' : 'Bulk: Add 7 Weekdays'}</button></div>
                        </div></div>
                    <div className="rounded-3xl overflow-hidden" style={cardStyle}>
                        <div className="px-5 py-4" style={{ borderBottom: '1px solid #d4ddd0' }}><h2 className="font-bold" style={{ color: '#1c1917' }}>Existing Slots — {slotDate}</h2><p className="text-xs mt-0.5" style={{ color: '#9c978f' }}>{existingSlots.length} slots</p></div>
                        {loadingSlots ? <div className="flex items-center justify-center py-10 gap-2" style={{ color: '#9c978f' }}><Loader2 size={16} className="animate-spin" />Loading...</div>
                            : existingSlots.length === 0 ? <div className="text-center py-10 text-sm" style={{ color: '#9c978f' }}>No slots.</div>
                                : <div className="max-h-96 overflow-y-auto">{existingSlots.map(s => (<div key={s.id} className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: '1px solid #e8ede5' }}>
                                    <div><p className="text-sm font-medium" style={{ color: '#1c1917' }}>{s.slot_time}</p><p className="text-xs" style={{ color: '#9c978f' }}>{s.booked_count}/{s.max_tokens} booked</p></div>
                                    <div className="flex items-center gap-2"><span className="text-xs px-2 py-0.5 rounded-full font-medium" style={s.isBlocked ? { backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } : { backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>{s.isBlocked ? 'Blocked' : 'Open'}</span>
                                        <button onClick={() => handleDeleteSlot(s.id)} style={{ color: '#dc2626' }}><X size={14} /></button></div></div>))}</div>}
                    </div>
                </div>)}

                {/* ANALYTICS */}
                {activeTab === 'analytics' && (<div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">{[{ l: 'Total (7d)', v: analytics.reduce((s, d) => s + d.total, 0), icon: <ClipboardList size={18} /> }, { l: 'Completed', v: analytics.reduce((s, d) => s + (d.completed || 0), 0), icon: <CheckCircle size={18} /> }, { l: 'Cancelled', v: analytics.reduce((s, d) => s + (d.cancelled || 0), 0), icon: <XCircle size={18} /> }, { l: 'Departments', v: departments.length, icon: <Building2 size={18} /> }].map(s => <div key={s.l} className="rounded-3xl p-4" style={cardStyle}><div className="flex items-center justify-between mb-2"><span style={{ color: '#d4613a' }}>{s.icon}</span><span className="text-xs" style={{ color: '#9c978f' }}>{s.l}</span></div><p className="text-3xl font-extrabold" style={{ color: '#1c1917' }}>{s.v}</p></div>)}</div>
                    {analytics.length > 0 ? <div className="rounded-3xl p-5" style={cardStyle}><h2 className="font-bold mb-4" style={{ color: '#1c1917' }}>Last 7 Days — Daily Bookings</h2><ResponsiveContainer width="100%" height={280}><BarChart data={analytics}><CartesianGrid strokeDasharray="3 3" stroke="#d4ddd0" /><XAxis dataKey="date" fontSize={11} tick={{ fill: '#6b6860' }} /><YAxis fontSize={11} tick={{ fill: '#6b6860' }} /><Tooltip contentStyle={{ background: '#fff', border: '1px solid #d4ddd0', borderRadius: '12px' }} /><Bar dataKey="total" name="Total" fill="#1c1917" radius={[6, 6, 0, 0]} /><Bar dataKey="completed" name="Completed" fill="#059669" radius={[6, 6, 0, 0]} /><Bar dataKey="cancelled" name="Cancelled" fill="#d4613a" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
                        : <div className="rounded-3xl p-10 text-center" style={cardStyle}><BarChart3 size={48} className="mx-auto mb-2" style={{ color: '#d4ddd0' }} /><p style={{ color: '#9c978f' }}>No data in the last 7 days.</p></div>}
                </div>)}

                {confirmModal.show && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}><div className="rounded-3xl p-6 max-w-md w-full animate-slide-up" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                    <div className="flex items-start gap-3 mb-4"><div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}><AlertTriangle size={18} style={{ color: '#dc2626' }} /></div><div><h3 className="font-bold" style={{ color: '#1c1917' }}>{confirmModal.title}</h3><p className="text-sm mt-1" style={{ color: '#6b6860' }}>{confirmModal.message}</p></div></div>
                    <div className="flex gap-3 justify-end"><button onClick={closeConfirm} className="px-5 py-2 rounded-full text-sm font-medium" style={{ border: '1px solid #d4ddd0', color: '#6b6860' }}>Cancel</button><button onClick={() => { confirmModal.onConfirm?.(); closeConfirm(); }} className="px-5 py-2 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#dc2626' }}>Confirm</button></div>
                </div></div>}
            </div>
        </div>
    );
};

export default AdminDashboard;
