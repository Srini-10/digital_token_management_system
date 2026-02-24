import { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getDepartments } from '../firebase/firestore';
import { format } from 'date-fns';

const LiveTokenScreen = () => {
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('all');
    const [calledTokens, setCalledTokens] = useState([]);
    const [blink, setBlink] = useState(false);
    const [time, setTime] = useState(new Date());
    const prevTokenRef = useRef(null);

    // Live clock
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Load departments
    useEffect(() => {
        getDepartments().then(d => setDepartments(d)).catch(() => { });
    }, []);

    // Subscribe to ALL called tokens today
    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const constraints = [
            where('status', '==', 'called'),
            where('booking_date', '==', today),
        ];
        if (selectedDept !== 'all') {
            constraints.push(where('department_id', '==', selectedDept));
        }
        const q = query(collection(db, 'tokens'), ...constraints);

        const unsub = onSnapshot(q, (snap) => {
            const tokens = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const ta = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
                    const tb = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
                    return tb - ta; // newest first
                });

            // Blink on new token
            const latest = tokens[0]?.token_number;
            if (latest && latest !== prevTokenRef.current) {
                prevTokenRef.current = latest;
                setBlink(true);
                setTimeout(() => setBlink(false), 1200);
            }
            setCalledTokens(tokens);
        });

        return unsub;
    }, [selectedDept]);

    const latestToken = calledTokens[0] || null;
    const deptName = selectedDept === 'all'
        ? 'All Departments'
        : departments.find(d => d.id === selectedDept)?.department_name || '';

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gov-navy flex flex-col">
            {/* Header */}
            <div className="bg-black/20 px-6 py-4 flex items-center justify-between border-b border-white/10 flex-wrap gap-3">
                <div>
                    <p className="text-white/60 text-xs uppercase tracking-widest">Government of Tamil Nadu</p>
                    <p className="text-white font-bold text-xl">Digital Token Display</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Clock */}
                    <div className="text-right">
                        <p className="text-gov-gold font-mono text-2xl font-bold">
                            {format(time, 'hh:mm:ss a')}
                        </p>
                        <p className="text-white/50 text-xs">{format(time, 'EEEE, dd MMM yyyy')}</p>
                    </div>
                    {/* Department filter */}
                    <select
                        value={selectedDept}
                        onChange={e => setSelectedDept(e.target.value)}
                        className="bg-white/10 border border-white/20 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gov-gold"
                    >
                        <option value="all" className="bg-gov-navy">All Departments</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id} className="bg-gov-navy">{d.department_name}</option>
                        ))}
                    </select>
                    {/* Live badge */}
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 text-xs font-bold uppercase tracking-wide">LIVE</span>
                    </div>
                </div>
            </div>

            {/* Main display */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                <p className="text-blue-300 text-sm font-semibold mb-1 uppercase tracking-widest">Now Serving</p>
                <p className="text-white/40 text-sm mb-8">{deptName}</p>

                {/* Primary token display */}
                <div className={`transition-all duration-300 ${blink ? 'scale-110' : 'scale-100'}`}>
                    {latestToken ? (
                        <div className="text-center">
                            <div className={`border-4 rounded-3xl px-16 py-10 shadow-2xl backdrop-blur-sm mb-6 transition-colors duration-500 ${blink ? 'bg-gov-gold/20 border-gov-gold' : 'bg-white/10 border-gov-gold'}`}>
                                <p className={`text-7xl sm:text-9xl font-extrabold tracking-wider leading-none transition-colors ${blink ? 'text-white' : 'text-gov-gold'}`}>
                                    {latestToken.token_number}
                                </p>
                            </div>
                            <div className="flex gap-8 justify-center flex-wrap">
                                <div className="text-center">
                                    <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Citizen</p>
                                    <p className="text-white font-semibold">{latestToken.user_name}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Department</p>
                                    <p className="text-white font-semibold">{latestToken.department_name}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Time Slot</p>
                                    <p className="text-white font-semibold">{latestToken.slot_time}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="bg-white/5 border-2 border-white/10 rounded-3xl px-16 py-10 mb-6">
                                <p className="text-white/20 text-7xl sm:text-9xl font-extrabold tracking-wider leading-none">– – –</p>
                            </div>
                            <p className="text-white/40 text-lg">Waiting for token calls...</p>
                            <p className="text-white/20 text-sm mt-1">Admin will call tokens from the dashboard</p>
                        </div>
                    )}
                </div>

                {/* Recent called tokens grid (if multiple) */}
                {calledTokens.length > 1 && (
                    <div className="mt-12 w-full max-w-2xl">
                        <p className="text-white/30 text-xs uppercase tracking-widest text-center mb-3">Also Called</p>
                        <div className="flex gap-3 justify-center flex-wrap">
                            {calledTokens.slice(1, 5).map(t => (
                                <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center">
                                    <p className="text-gov-gold font-bold text-xl">{t.token_number}</p>
                                    <p className="text-white/40 text-xs mt-0.5">{t.department_name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer ticker */}
            <div className="bg-gov-gold py-2.5 overflow-hidden">
                <div className="whitespace-nowrap">
                    <span className="text-gov-navy font-bold text-sm px-8 inline-block">
                        🏛 Welcome to Government of Tamil Nadu Digital Token System &nbsp;·&nbsp;
                        Please arrive 10 minutes before your scheduled slot &nbsp;·&nbsp;
                        Carry your token PDF and a valid ID proof &nbsp;·&nbsp;
                        Token calls are managed by the department counter staff
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LiveTokenScreen;
