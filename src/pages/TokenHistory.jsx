import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserTokens, cancelToken } from '../firebase/firestore';
import TokenCard from '../components/TokenCard';
import toast from 'react-hot-toast';

const STATUS_FILTERS = ['all', 'pending', 'completed', 'cancelled', 'called'];

const TokenHistory = () => {
    const { currentUser } = useAuth();
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [cancelling, setCancelling] = useState(null);

    const fetchTokens = async () => {
        try {
            const data = await getUserTokens(currentUser.uid);
            setTokens(data);
        } catch {
            toast.error('Failed to load token history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (currentUser) fetchTokens(); }, [currentUser]);

    const handleCancel = async (token) => {
        if (!window.confirm(`Cancel token ${token.token_number}? This cannot be undone.`)) return;
        setCancelling(token.id);
        try {
            await cancelToken(token.id, token.slot_id);
            toast.success('Token cancelled successfully');
            fetchTokens();
        } catch (err) {
            toast.error(err.message || 'Cancel failed');
        } finally {
            setCancelling(null);
        }
    };

    const filtered = filter === 'all' ? tokens : tokens.filter(t => t.status === filter);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gov-navy">My Token History</h1>
                <span className="text-sm text-gray-500">{tokens.length} total</span>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap mb-6">
                {STATUS_FILTERS.map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filter === s ? 'bg-gov-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gov-blue hover:text-gov-blue'
                            }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-3 border-gov-blue border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <p className="text-5xl mb-3">🎫</p>
                    <p className="text-gray-500 font-medium">
                        {filter === 'all' ? 'No tokens booked yet.' : `No ${filter} tokens.`}
                    </p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {filtered.map(token => (
                        <div key={token.id} className={cancelling === token.id ? 'opacity-50 pointer-events-none' : ''}>
                            <TokenCard token={token} onCancel={handleCancel} showActions={true} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TokenHistory;
