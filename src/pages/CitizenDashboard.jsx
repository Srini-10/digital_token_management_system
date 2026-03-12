import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserTokens } from '../firebase/firestore';
import { Ticket, CheckCircle, XCircle, ArrowUpRight, Calendar, BarChart3, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

const CitizenDashboard = () => {
    const { currentUser, userProfile } = useAuth();
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => { try { setTokens(await getUserTokens(currentUser.uid)); } catch { toast.error('Failed to load tokens'); } finally { setLoading(false); } };
        if (currentUser) fetch();
    }, [currentUser]);

    const upcoming = tokens.filter(t => t.status === 'pending').slice(0, 3);
    const totalBookings = tokens.length;
    const completedCount = tokens.filter(t => t.status === 'completed').length;
    const cancelledCount = tokens.filter(t => t.status === 'cancelled').length;
    const statusColors = { pending: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' }, completed: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' }, cancelled: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' }, called: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' } };

    return (
        <div style={{ backgroundColor: '#f0ede6', minHeight: '100vh' }}>
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                        <span className="text-xl font-bold" style={{ color: '#d4613a' }}>{(userProfile?.name || currentUser?.displayName || 'U')[0].toUpperCase()}</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#1c1917' }}>Welcome, {userProfile?.name?.split(' ')[0] || 'Citizen'}!</h1>
                        <p className="text-sm" style={{ color: '#9c978f' }}>{userProfile?.email} · Citizen Account</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[{ label: 'Total Tokens', value: totalBookings, icon: <Ticket size={20} /> },
                    { label: 'Completed', value: completedCount, icon: <CheckCircle size={20} /> },
                    { label: 'Cancelled', value: cancelledCount, icon: <XCircle size={20} /> }].map(s => (
                        <div key={s.label} className="rounded-3xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                            <div className="flex items-center justify-between mb-3">
                                <span style={{ color: '#d4613a' }}>{s.icon}</span>
                                <span className="text-xs font-medium" style={{ color: '#9c978f' }}>{s.label}</span>
                            </div>
                            <p className="text-4xl font-extrabold" style={{ color: '#1c1917' }}>{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <Link to="/book-token" className="rounded-3xl p-6 flex items-center gap-4 transition-all hover:shadow-lg" style={{ backgroundColor: '#1c1917' }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(212,97,58,0.2)' }}><Ticket size={24} style={{ color: '#d4613a' }} /></div>
                        <div><p className="text-lg font-semibold" style={{ color: '#f5f2ec' }}>Book a Token</p><p className="text-sm mt-0.5" style={{ color: '#9c978f' }}>Select department & time slot</p></div>
                        <ArrowUpRight size={18} className="ml-auto" style={{ color: '#9c978f' }} />
                    </Link>
                    <Link to="/token-history" className="rounded-3xl p-6 flex items-center gap-4 transition-all hover:shadow-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f0ede6' }}><ClipboardList size={24} style={{ color: '#d4613a' }} /></div>
                        <div><p className="text-lg font-semibold" style={{ color: '#1c1917' }}>My History</p><p className="text-sm mt-0.5" style={{ color: '#6b6860' }}>View all booked tokens</p></div>
                        <ArrowUpRight size={18} className="ml-auto" style={{ color: '#9c978f' }} />
                    </Link>
                </div>

                <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                    <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #d4ddd0' }}>
                        <div><h2 className="text-lg font-bold" style={{ color: '#1c1917' }}>Upcoming Tokens</h2><p className="text-xs mt-0.5" style={{ color: '#9c978f' }}>{upcoming.length} pending</p></div>
                        {upcoming.length > 0 && <Link to="/token-history" className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: '#d4613a' }}>View all <ArrowUpRight size={14} /></Link>}
                    </div>
                    {loading ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid #d4ddd0', borderTopColor: '#d4613a' }} /></div>
                        : upcoming.length === 0 ? <div className="text-center py-14 px-6"><Ticket size={48} className="mx-auto mb-3" style={{ color: '#d4ddd0' }} /><p className="font-medium mb-1" style={{ color: '#6b6860' }}>No upcoming tokens</p><p className="text-sm mb-5" style={{ color: '#9c978f' }}>Book your first appointment to get started.</p><Link to="/book-token" className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#d4613a' }}>Book Your Token</Link></div>
                            : <div>{upcoming.map((token, i) => {
                                const sc = statusColors[token.status] || statusColors.pending; return (
                                    <div key={token.id} className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: i < upcoming.length - 1 ? '1px solid #e8ede5' : 'none' }}>
                                        <div className="w-16 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={i === 0 ? { backgroundColor: '#1c1917', color: '#f5f2ec' } : { backgroundColor: '#f0ede6', color: '#6b6860', border: '1px solid #d4ddd0' }}>
                                            {token.slot_time?.split(' - ')[0]?.replace(/ (AM|PM)/, '') || '—'}</div>
                                        <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="font-bold text-sm" style={{ color: '#1c1917' }}>{token.user_name || userProfile?.name}</p><span className="text-xs" style={{ color: '#9c978f' }}>({token.token_number})</span></div><p className="text-sm truncate" style={{ color: '#6b6860' }}>{token.department_name}</p></div>
                                        <div className="text-right flex-shrink-0 hidden sm:block"><p className="text-xs font-medium" style={{ color: '#6b6860' }}>{token.booking_date}</p><p className="text-xs" style={{ color: '#9c978f' }}>{token.slot_time}</p></div>
                                        <span className="text-xs font-semibold px-3 py-1 rounded-full capitalize flex-shrink-0" style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{token.status}</span>
                                    </div>);
                            })}</div>}
                </div>

                {tokens.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="rounded-3xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold" style={{ color: '#1c1917' }}>Last Booking</h3><Calendar size={18} style={{ color: '#d4613a' }} /></div>
                            <p className="font-bold text-lg" style={{ color: '#d4613a' }}>{tokens[0]?.token_number || '—'}</p>
                            <p className="text-xs mt-1" style={{ color: '#9c978f' }}>{tokens[0]?.department_name}</p><p className="text-xs" style={{ color: '#9c978f' }}>{tokens[0]?.booking_date} · {tokens[0]?.slot_time}</p>
                        </div>
                        <div className="rounded-3xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold" style={{ color: '#1c1917' }}>Completion Rate</h3><BarChart3 size={18} style={{ color: '#d4613a' }} /></div>
                            <p className="font-bold text-lg" style={{ color: '#1c1917' }}>{totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0}%</p>
                            <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ede6' }}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${totalBookings > 0 ? (completedCount / totalBookings) * 100 : 0}%`, backgroundColor: '#d4613a' }} /></div>
                            <p className="text-xs mt-1.5" style={{ color: '#9c978f' }}>{completedCount} of {totalBookings} completed</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CitizenDashboard;
