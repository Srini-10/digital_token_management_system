import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserTokens, cancelToken } from '../firebase/firestore';
import { Ticket, Calendar, Clock, ClipboardList, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_FILTERS = ['all', 'pending', 'completed', 'cancelled', 'called'];
const statusColors = { pending: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' }, completed: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' }, cancelled: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' }, called: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' } };

const TokenHistory = () => {
    const { currentUser, userProfile } = useAuth();
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [cancelling, setCancelling] = useState(null);

    const fetchTokens = async () => {
        try {
            const result = await getUserTokens(currentUser.uid);
            setTokens(result);
        } catch {
            toast.error('Failed to load');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (currentUser) fetchTokens(); }, [currentUser]);

    const handleCancel = async (token) => {
        if (!window.confirm(`Cancel ${token.token_number}?`)) return;
        setCancelling(token.id);
        try {
            await cancelToken(token.id, token.slot_id);
            toast.success('Cancelled');
            fetchTokens();
        } catch (e) {
            toast.error(e.message || 'Failed');
        } finally {
            setCancelling(null);
        }
    };

    const filtered = filter === 'all' ? tokens : tokens.filter(t => t.status === filter);

    // Handles both camelCase and snake_case — whichever your Firestore function returns
    const getLocation = (token) => token.office_location || token.officeLocation || null;
    const getSubdivision = (token) => token.subdivision || null;

    return (
        <div style={{ backgroundColor: '#f0ede6', minHeight: '100vh' }}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold" style={{ color: '#1c1917' }}>My Token History</h1>
                    <span className="text-sm" style={{ color: '#9c978f' }}>{tokens.length} total</span>
                </div>
                <div className="flex gap-2 flex-wrap mb-6">
                    {STATUS_FILTERS.map(s => (
                        <button key={s} onClick={() => setFilter(s)} className="px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all"
                            style={filter === s ? { backgroundColor: '#ffffff', color: '#1c1917', border: '1px solid #d4ddd0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } : { backgroundColor: 'transparent', color: '#6b6860', border: '1px solid #d4ddd0' }}>{s}</button>
                    ))}
                </div>

                {loading
                    ? <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid #d4ddd0', borderTopColor: '#d4613a' }} /></div>
                    : filtered.length === 0
                        ? <div className="text-center py-16 rounded-3xl" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                            <Ticket size={48} className="mx-auto mb-3" style={{ color: '#d4ddd0' }} />
                            <p className="font-medium" style={{ color: '#6b6860' }}>{filter === 'all' ? 'No tokens booked yet.' : `No ${filter} tokens.`}</p>
                        </div>
                        : <div className="grid sm:grid-cols-2 gap-4">
                            {filtered.map(token => {
                                const sc = statusColors[token.status] || statusColors.pending;
                                const location = getLocation(token);
                                const subdivision = getSubdivision(token);
                                return (
                                    <div key={token.id}
                                        className={`rounded-3xl p-5 transition-all duration-200 ${cancelling === token.id ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'}`}
                                        style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>

                                        {/* Token number + status badge */}
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="font-bold text-lg" style={{ color: '#d4613a' }}>{token.token_number}</p>
                                            <span className="text-xs font-semibold px-3 py-1 rounded-full capitalize"
                                                style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{token.status}</span>
                                        </div>

                                        {/* Department name */}
                                        <p className="font-medium text-sm mb-0.5" style={{ color: '#1c1917' }}>{token.department_name}</p>

                                        {/* Location */}
                                        {location && (
                                            <p className="text-xs mb-1 flex items-center gap-1" style={{ color: '#9c978f' }}>
                                                <MapPin size={12} /> {location}
                                            </p>
                                        )}

                                        {/* Service / subdivision */}
                                        {subdivision && (
                                            <p className="text-xs mb-2 flex items-center gap-1" style={{ color: '#d4613a' }}>
                                                <ClipboardList size={12} /> {subdivision}
                                            </p>
                                        )}

                                        {/* Citizen name */}
                                        <p className="text-sm" style={{ color: '#6b6860' }}>{token.user_name || userProfile?.name}</p>

                                        {/* Date + time */}
                                        <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid #e8ede5' }}>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} style={{ color: '#9c978f' }} />
                                                <span className="text-sm" style={{ color: '#6b6860' }}>{token.booking_date}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={13} style={{ color: '#9c978f' }} />
                                                <span className="text-sm" style={{ color: '#6b6860' }}>{token.slot_time}</span>
                                            </div>
                                        </div>

                                        {/* Cancel button */}
                                        {token.status === 'pending' && (
                                            <button onClick={() => handleCancel(token)}
                                                className="mt-3 w-full text-sm font-medium py-2 rounded-full transition-all"
                                                style={{ color: '#dc2626', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
                                                Cancel Token
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                }
            </div>
        </div>
    );
};

export default TokenHistory;