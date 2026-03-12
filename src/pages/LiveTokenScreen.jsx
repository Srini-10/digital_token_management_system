import { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getDepartments } from '../firebase/firestore';
import { format } from 'date-fns';
import { Radio, AlertTriangle, CheckCircle, Landmark } from 'lucide-react';

const LiveTokenScreen = () => {
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('all');
    const [calledTokens, setCalledTokens] = useState([]);
    const [blink, setBlink] = useState(false);
    const [time, setTime] = useState(new Date());
    const [liveError, setLiveError] = useState(null);
    const [totalServedToday, setTotalServedToday] = useState(0);
    const prevTokenRef = useRef(null);

    useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
    useEffect(() => { getDepartments().then(d => setDepartments(d)).catch(() => { }); }, []);

    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const q = query(collection(db, 'tokens'), where('booking_date', '==', today));
        return onSnapshot(q, s => setTotalServedToday(s.docs.map(d => d.data()).filter(t => t.status === 'completed').length), () => { });
    }, []);

    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const c = [where('status', '==', 'called'), where('booking_date', '==', today)];
        if (selectedDept !== 'all') c.push(where('department_id', '==', selectedDept));
        return onSnapshot(query(collection(db, 'tokens'), ...c), snap => {
            setLiveError(null);
            const tokens = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0));
            const latest = tokens[0]?.token_number;
            if (latest && latest !== prevTokenRef.current) {
                prevTokenRef.current = latest; setBlink(true);
                try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.setValueAtTime(880, ctx.currentTime); o.frequency.setValueAtTime(1100, ctx.currentTime + 0.15); g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.5); } catch { }
                setTimeout(() => setBlink(false), 2000);
            }
            setCalledTokens(tokens);
        }, err => setLiveError(err.code === 'permission-denied' ? 'Firestore rules deny reads.' : err.message));
    }, [selectedDept]);

    const latestToken = calledTokens[0] || null;
    const deptName = selectedDept === 'all' ? 'All Departments' : departments.find(d => d.id === selectedDept)?.department_name || '';

    return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col" style={{ backgroundColor: '#1c1917' }}>
            <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: '1px solid rgba(212,221,208,0.1)' }}>
                <div>
                    <p className="text-xs uppercase tracking-widest" style={{ color: '#9c978f' }}>Government of Tamil Nadu</p>
                    <p className="font-bold text-xl" style={{ color: '#f5f2ec' }}>Digital Token Display</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right"><p className="font-mono text-2xl font-bold" style={{ color: '#d4613a' }}>{format(time, 'hh:mm:ss a')}</p><p className="text-xs" style={{ color: '#9c978f' }}>{format(time, 'EEEE, dd MMM yyyy')}</p></div>
                    <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="text-sm rounded-full px-3 py-2 focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,221,208,0.2)', color: '#f5f2ec' }}>
                        <option value="all">All Departments</option>{departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                    </select>
                    <div className="flex items-center gap-1.5"><Radio size={12} className="text-red-500 animate-pulse" /><span className="text-red-400 text-xs font-bold uppercase">LIVE</span></div>
                </div>
            </div>

            {liveError && <div className="px-6 py-3 text-center flex items-center justify-center gap-2" style={{ backgroundColor: 'rgba(220,38,38,0.15)', borderBottom: '1px solid rgba(220,38,38,0.2)' }}><AlertTriangle size={14} style={{ color: '#fca5a5' }} /><p className="text-sm" style={{ color: '#fca5a5' }}>{liveError}</p></div>}

            <div className="px-6 py-2.5 flex items-center justify-center gap-8 flex-wrap" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(212,221,208,0.08)' }}>
                <div className="flex items-center gap-2"><Radio size={8} className="text-red-500 animate-pulse" /><span className="text-xs uppercase tracking-wide" style={{ color: '#9c978f' }}>Called</span><span className="font-bold text-sm" style={{ color: '#f5f2ec' }}>{calledTokens.length}</span></div>
                <div className="flex items-center gap-2"><CheckCircle size={12} style={{ color: '#10b981' }} /><span className="text-xs uppercase tracking-wide" style={{ color: '#9c978f' }}>Served Today</span><span className="font-bold text-sm" style={{ color: '#10b981' }}>{totalServedToday}</span></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                <p className="text-sm font-semibold mb-1 uppercase tracking-widest" style={{ color: '#d4613a' }}>Now Serving</p>
                <p className="text-sm mb-8" style={{ color: '#9c978f' }}>{deptName}</p>
                <div className={`transition-all duration-500 ease-out ${blink ? 'scale-110' : 'scale-100'}`}>
                    {latestToken ? (
                        <div className="text-center">
                            <div className="relative rounded-3xl px-16 py-10 mb-6 transition-all duration-700"
                                style={{ border: blink ? '2px solid #d4613a' : '2px solid rgba(212,221,208,0.2)', backgroundColor: blink ? 'rgba(212,97,58,0.08)' : 'rgba(255,255,255,0.03)', boxShadow: blink ? '0 0 80px rgba(212,97,58,0.15)' : 'none' }}>
                                {blink && <div className="absolute inset-0 rounded-3xl animate-ping pointer-events-none" style={{ border: '2px solid rgba(212,97,58,0.3)' }} />}
                                <p className="text-7xl sm:text-9xl font-bold leading-none transition-colors duration-500" style={{ color: blink ? '#d4613a' : '#f5f2ec' }}>{latestToken.token_number}</p>
                            </div>
                            <div className="flex gap-8 justify-center flex-wrap">
                                {[{ l: 'Citizen', v: latestToken.user_name }, { l: 'Department', v: latestToken.department_name }, { l: 'Time Slot', v: latestToken.slot_time }].map(item => (
                                    <div key={item.l} className="text-center"><p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#9c978f' }}>{item.l}</p><p className="font-semibold text-lg" style={{ color: '#f5f2ec' }}>{item.v}</p></div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="rounded-3xl px-16 py-10 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,221,208,0.1)' }}>
                                <p className="text-7xl sm:text-9xl font-bold leading-none" style={{ color: 'rgba(212,221,208,0.2)' }}>– – –</p>
                            </div>
                            <p className="text-lg" style={{ color: '#9c978f' }}>Waiting for token calls...</p>
                        </div>
                    )}
                </div>

                {calledTokens.length > 1 && (
                    <div className="mt-12 w-full max-w-3xl">
                        <p className="text-xs uppercase tracking-widest text-center mb-4" style={{ color: '#9c978f' }}>Also Called</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {calledTokens.slice(1, 9).map(t => (
                                <div key={t.id} className="rounded-3xl px-4 py-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,221,208,0.1)' }}>
                                    <p className="font-bold text-2xl" style={{ color: '#d4613a' }}>{t.token_number}</p>
                                    <p className="text-sm mt-1 font-medium" style={{ color: 'rgba(245,242,236,0.6)' }}>{t.user_name}</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#9c978f' }}>{t.department_name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="py-2.5 overflow-hidden" style={{ backgroundColor: '#d4613a' }}>
                <div className="whitespace-nowrap animate-marquee">
                    <span className="text-white font-bold text-sm px-8 inline-block">
                        <Landmark size={14} className="inline mr-1" /> Welcome to Government of Tamil Nadu Digital Token System &nbsp;·&nbsp;
                        Please arrive 10 minutes before your scheduled slot &nbsp;·&nbsp;
                        Carry your token PDF and a valid ID proof &nbsp;·&nbsp;
                        {totalServedToday > 0 ? `${totalServedToday} citizens served today` : 'Service begins shortly'}
                    </span>
                </div>
            </div>
            <style>{`@keyframes marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}.animate-marquee{animation:marquee 30s linear infinite}`}</style>
        </div>
    );
};

export default LiveTokenScreen;
