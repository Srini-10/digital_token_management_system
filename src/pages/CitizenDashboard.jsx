import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserTokens } from '../firebase/firestore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CitizenDashboard = () => {
    const { currentUser, userProfile } = useAuth();
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const data = await getUserTokens(currentUser.uid);
                setTokens(data);
            } catch (err) {
                toast.error('Failed to load tokens');
            } finally {
                setLoading(false);
            }
        };
        if (currentUser) fetchTokens();
    }, [currentUser]);

    const upcoming = tokens.filter(t => t.status === 'pending').slice(0, 3);
    const totalBookings = tokens.length;
    const completedCount = tokens.filter(t => t.status === 'completed').length;
    const cancelledCount = tokens.filter(t => t.status === 'cancelled').length;

    const statusColors = {
        pending: 'bg-amber-100 text-amber-800 border-amber-200',
        completed: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200',
        called: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Welcome Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gov-navy rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-gov-gold font-bold text-xl">
                        {(userProfile?.name || currentUser?.displayName || 'U')[0].toUpperCase()}
                    </span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gov-navy">
                        Welcome, {userProfile?.name?.split(' ')[0] || 'Citizen'}! 👋
                    </h1>
                    <p className="text-gray-500 text-sm">{userProfile?.email} · Citizen Account</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Total Tokens', value: totalBookings, color: 'text-gov-blue', bg: 'bg-blue-50' },
                    { label: 'Completed', value: completedCount, color: 'text-green-700', bg: 'bg-green-50' },
                    { label: 'Cancelled', value: cancelledCount, color: 'text-red-700', bg: 'bg-red-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white shadow-sm`}>
                        <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                        <p className="text-gray-600 text-sm mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <Link
                    to="/book-token"
                    className="bg-gov-navy hover:bg-gov-blue text-white rounded-2xl p-6 flex items-center gap-4 transition-all duration-200 group shadow-sm hover:shadow-md"
                >
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl group-hover:bg-white/20 transition-colors">
                        🎫
                    </div>
                    <div>
                        <p className="font-bold text-lg">Book a Token</p>
                        <p className="text-blue-200 text-sm">Select department & time slot</p>
                    </div>
                </Link>
                <Link
                    to="/token-history"
                    className="bg-white hover:bg-gov-light border border-gray-200 text-gov-navy rounded-2xl p-6 flex items-center gap-4 transition-all duration-200 group shadow-sm hover:shadow-md"
                >
                    <div className="w-12 h-12 bg-gov-light rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-100 transition-colors">
                        📋
                    </div>
                    <div>
                        <p className="font-bold text-lg">My History</p>
                        <p className="text-gray-500 text-sm">View all booked tokens</p>
                    </div>
                </Link>
            </div>

            {/* Upcoming Tokens */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gov-navy text-lg">Upcoming Tokens</h2>
                    {upcoming.length > 0 && (
                        <Link to="/token-history" className="text-gov-blue text-sm hover:underline">View all →</Link>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-3 border-gov-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : upcoming.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
                        <p className="text-4xl mb-3">🎫</p>
                        <p className="text-gray-500 font-medium mb-4">No upcoming tokens</p>
                        <Link to="/book-token" className="bg-gov-navy text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gov-blue transition-colors">
                            Book Your Token
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcoming.map(token => (
                            <div key={token.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-gov-light rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-gov-blue font-bold text-xs text-center leading-tight">{token.token_number?.split('-')[0]}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gov-navy">{token.token_number}</p>
                                    <p className="text-gray-500 text-sm truncate">{token.department_name}</p>
                                    <p className="text-gray-400 text-xs">{token.booking_date} · {token.slot_time}</p>
                                </div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize flex-shrink-0 ${statusColors[token.status]}`}>
                                    {token.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CitizenDashboard;
