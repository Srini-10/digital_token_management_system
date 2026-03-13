import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDepartments, getSlotsForDepartmentDate, getHolidays, bookToken } from '../firebase/firestore';
import { autoSeedIfEmpty } from '../firebase/seedData';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, addMonths, subMonths, isBefore, startOfDay } from 'date-fns';
import { Ticket, Building2, ClipboardList, MapPin, CheckCircle, Check, Sprout, Loader2, ChevronLeft, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STEPS = ['Department', 'Service', 'Date & Slot', 'Confirm'];

const BookToken = () => {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [departments, setDepartments] = useState([]); const [holidays, setHolidays] = useState([]); const [slots, setSlots] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null); const [selectedSubdivision, setSelectedSubdivision] = useState('');
    const [selectedDate, setSelectedDate] = useState(''); const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false); const [deptLoading, setDeptLoading] = useState(true); const [booking, setBooking] = useState(false); const [seeding, setSeeding] = useState(false); const [bookedToken, setBookedToken] = useState(null);
    const todayDate = startOfDay(new Date()); const todayStr = format(todayDate, 'yyyy-MM-dd'); const maxDate = format(addDays(todayDate, 30), 'yyyy-MM-dd');
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(todayDate));

    const renderCalendarDays = () => { const ms = startOfMonth(currentMonth); const days = []; let day = startOfWeek(ms); const end = endOfWeek(endOfMonth(ms)); while (day <= end) { days.push(day); day = addDays(day, 1); } return days; };
    const loadDepartments = async () => { setDeptLoading(true); try { const [d, h] = await Promise.all([getDepartments(), getHolidays()]); setDepartments(d); setHolidays(h.map(x => x.date)); } catch { toast.error('Failed to load.'); } finally { setDeptLoading(false); } };
    useEffect(() => { loadDepartments(); }, []);
    useEffect(() => { if (selectedDept && selectedDate) { setLoading(true); getSlotsForDepartmentDate(selectedDept.id, selectedDate).then(setSlots).catch(() => toast.error('Failed')).finally(() => setLoading(false)); } }, [selectedDept, selectedDate]);
    const isHoliday = (d) => holidays.includes(d);
    const handleDateSelect = (d) => { if (isHoliday(d)) { toast.error('Holiday.'); return; } setSelectedDate(d); setSelectedSlot(null); };
    const handleSeedData = async () => { setSeeding(true); try { await autoSeedIfEmpty(); await loadDepartments(); toast.success('Loaded!'); } catch (e) { toast.error('Failed'); } finally { setSeeding(false); } };

    const handleBook = async () => {
        if (!selectedDept || !selectedDate || !selectedSlot) { toast.error('Complete all selections'); return; }
        setBooking(true);
        try {
            const r = await bookToken({
                userId: currentUser.uid,
                departmentId: selectedDept.id,
                slotId: selectedSlot.id,
                departmentCode: selectedDept.department_name.split(' ')[0].substring(0, 3).toUpperCase(),
                userName: userProfile?.name || currentUser.displayName,
                departmentName: selectedDept.department_name,
                officeLocation: selectedDept.office_location,   // ← ADDED
                subdivision: selectedSubdivision || null,
                slotTime: selectedSlot.slot_time,
                date: selectedDate
            });
            setBookedToken(r);
            toast.success(`Booked! ${r.tokenNumber}`);
            setStep(4);
        }
        catch (e) { toast.error(e.message || 'Failed.'); } finally { setBooking(false); }
    };

    const cardStyle = { backgroundColor: '#ffffff', border: '1px solid #d4ddd0' };
    const inputStyle = { backgroundColor: '#f0ede6', border: '1px solid #d4ddd0', color: '#1c1917' };

    if (step === 4 && bookedToken) {
        return (<div style={{ backgroundColor: '#f0ede6', minHeight: '100vh' }} className="flex items-center justify-center px-4 py-10"><div className="max-w-lg w-full animate-slide-up">
            <div className="rounded-3xl p-8 text-center" style={cardStyle}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}><CheckCircle size={32} style={{ color: '#059669' }} /></div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#1c1917' }}>Token Booked!</h2>
                <p className="mb-6" style={{ color: '#6b6860' }}>Your appointment has been confirmed.</p>
                <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#f0ede6', border: '1px solid #d4ddd0' }}>
                    <p className="text-sm mb-1" style={{ color: '#9c978f' }}>Your Token Number</p>
                    <p className="text-3xl font-bold" style={{ color: '#d4613a' }}>{bookedToken.tokenNumber}</p>
                    <p className="text-sm mt-3" style={{ color: '#6b6860' }}>{selectedDept?.department_name}</p>
                    {selectedDept?.office_location && <p className="text-xs mt-0.5 flex items-center justify-center gap-1" style={{ color: '#9c978f' }}><MapPin size={12} /> {selectedDept.office_location}</p>}
                    {selectedSubdivision && <p className="text-xs mt-0.5 flex items-center justify-center gap-1" style={{ color: '#d4613a' }}><ClipboardList size={12} /> {selectedSubdivision}</p>}
                    <p className="text-sm font-medium mt-1" style={{ color: '#1c1917' }}>{selectedDate} · {selectedSlot?.slot_time}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/token-history')} className="flex-1 text-white font-semibold py-3 rounded-full" style={{ backgroundColor: '#1c1917' }}>View My Tokens</button>
                    <button onClick={() => { setStep(0); setSelectedDept(null); setSelectedSubdivision(''); setSelectedDate(''); setSelectedSlot(null); setBookedToken(null); }} className="flex-1 font-semibold py-3 rounded-full" style={{ border: '1px solid #d4ddd0', color: '#6b6860' }}>Book Another</button>
                </div>
            </div>
        </div></div>);
    }

    return (
        <div style={{ backgroundColor: '#f0ede6', minHeight: '100vh' }}>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6" style={{ color: '#1c1917' }}>Book a Token</h1>
                <div className="flex items-center mb-8 overflow-x-auto pb-1">
                    {STEPS.map((s, i) => (<div key={s} className="flex items-center flex-1 last:flex-none min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={i <= step ? { backgroundColor: '#d4613a', color: '#fff' } : { backgroundColor: '#f0ede6', color: '#9c978f', border: '1px solid #d4ddd0' }}>{i < step ? <Check size={14} /> : i + 1}</div>
                        <span className="ml-2 text-sm font-medium whitespace-nowrap" style={{ color: i === step ? '#1c1917' : '#9c978f' }}>{s}</span>
                        {i < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-3 min-w-4" style={{ backgroundColor: i < step ? '#d4613a' : '#d4ddd0' }} />}
                    </div>))}
                </div>

                {step === 0 && (<div>
                    <p className="mb-4 text-sm" style={{ color: '#6b6860' }}>Select the department:</p>
                    {deptLoading ? <div className="flex items-center justify-center gap-3 py-16" style={{ color: '#9c978f' }}><Loader2 size={20} className="animate-spin" /> Loading...</div>
                        : departments.length === 0 ? <div className="text-center py-14 rounded-3xl" style={cardStyle}><Building2 size={48} className="mx-auto mb-3" style={{ color: '#d4ddd0' }} /><p className="font-bold mb-4" style={{ color: '#1c1917' }}>No Departments Found</p><button onClick={handleSeedData} disabled={seeding} className="text-white font-semibold px-8 py-3 rounded-full mx-auto flex items-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#1c1917' }}><Sprout size={16} />{seeding ? 'Loading...' : 'Load Demo Departments'}</button></div>
                            : <div className="grid sm:grid-cols-2 gap-3">{departments.map(dept => (
                                <button key={dept.id} onClick={() => { setSelectedDept(dept); setSelectedSubdivision(''); setStep(1); }} className="rounded-3xl p-4 text-left transition-all hover:shadow-md" style={cardStyle}>
                                    <p className="font-semibold" style={{ color: '#1c1917' }}>{dept.department_name}</p>
                                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#9c978f' }}><MapPin size={11} /> {dept.office_location}</p>
                                    {dept.subdivisions?.length > 0 && <p className="text-xs mt-2" style={{ color: '#d4613a' }}>{dept.subdivisions.length} services →</p>}
                                </button>))}</div>}
                </div>)}

                {step === 1 && (<div>
                    <div className="flex items-center gap-3 mb-6"><button onClick={() => setStep(0)} className="text-sm hover:underline flex items-center gap-1" style={{ color: '#d4613a' }}><ChevronLeft size={14} /> Back</button><div className="rounded-full px-4 py-1.5" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}><span className="font-semibold text-sm" style={{ color: '#1c1917' }}>{selectedDept?.department_name}</span></div></div>
                    <p className="mb-4 text-sm font-medium" style={{ color: '#6b6860' }}>What service?</p>
                    {selectedDept?.subdivisions?.length > 0 ? <div className="space-y-2 mb-6">
                        <button onClick={() => { setSelectedSubdivision(''); setStep(2); }} className="w-full rounded-2xl p-3 text-left text-sm flex items-center gap-2" style={{ backgroundColor: '#ffffff', border: '1px dashed #d4ddd0', color: '#6b6860' }}><Minus size={14} /> General Visit</button>
                        {selectedDept.subdivisions.map(sub => (<button key={sub} onClick={() => { setSelectedSubdivision(sub); setStep(2); }} className="w-full rounded-2xl p-3.5 text-left text-sm font-medium flex items-center gap-2"
                            style={selectedSubdivision === sub ? { backgroundColor: 'rgba(212,97,58,0.06)', border: '1px solid #d4613a', color: '#1c1917' } : { backgroundColor: '#ffffff', border: '1px solid #d4ddd0', color: '#6b6860' }}><ClipboardList size={14} /> {sub}</button>))}
                    </div> : <div className="rounded-2xl p-4 mb-4 text-sm" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>No specific services listed. <button onClick={() => setStep(2)} className="block mt-3 text-white px-6 py-2 rounded-full font-medium" style={{ backgroundColor: '#1c1917' }}>Continue →</button></div>}
                </div>)}

                {step === 2 && (<div>
                    <div className="flex items-center gap-3 mb-6"><button onClick={() => setStep(1)} className="text-sm hover:underline flex items-center gap-1" style={{ color: '#d4613a' }}><ChevronLeft size={14} /> Back</button>
                        <div className="flex gap-2 flex-wrap"><div className="rounded-full px-3 py-1.5" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}><span className="font-semibold text-sm" style={{ color: '#1c1917' }}>{selectedDept?.department_name}</span></div>
                            {selectedSubdivision && <div className="rounded-full px-3 py-1.5 flex items-center gap-1" style={{ backgroundColor: 'rgba(212,97,58,0.08)', border: '1px solid rgba(212,97,58,0.2)' }}><ClipboardList size={12} style={{ color: '#d4613a' }} /><span className="text-sm" style={{ color: '#d4613a' }}>{selectedSubdivision}</span></div>}</div></div>
                    <div className="mb-8"><label className="block text-sm font-medium mb-3" style={{ color: '#6b6860' }}>Select Date</label>
                        <div className="rounded-3xl p-5 max-w-sm mx-auto sm:mx-0" style={cardStyle}>
                            <div className="flex justify-between items-center mb-4"><button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} disabled={isBefore(currentMonth, startOfMonth(todayDate))} className="p-2 rounded-xl disabled:opacity-30" style={{ color: '#6b6860' }}>←</button><h3 className="font-bold" style={{ color: '#1c1917' }}>{format(currentMonth, 'MMMM yyyy')}</h3><button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl" style={{ color: '#6b6860' }}>→</button></div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-xs font-semibold py-1" style={{ color: '#9c978f' }}>{d}</div>)}</div>
                            <div className="grid grid-cols-7 gap-1">{renderCalendarDays().map((day, i) => {
                                const dStr = format(day, 'yyyy-MM-dd'); const isSel = selectedDate === dStr; const isPast = isBefore(day, todayDate); const isFar = dStr > maxDate; const isCur = isSameMonth(day, currentMonth); const isHol = isHoliday(dStr); const dis = isPast || isFar || isHol;
                                return <button key={i} disabled={dis} onClick={() => handleDateSelect(dStr)} className="aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all"
                                    style={isSel ? { backgroundColor: '#d4613a', color: '#fff', boxShadow: '0 2px 8px rgba(212,97,58,0.3)', transform: 'scale(1.1)' } : !isCur ? { color: '#d4ddd0' } : dis && isHol ? { backgroundColor: '#fef2f2', color: '#fca5a5', textDecoration: 'line-through' } : (isPast || isFar) ? { opacity: 0.3 } : { color: '#6b6860' }}>{format(day, 'd')}</button>;
                            })}</div>
                        </div></div>
                    {selectedDate && (<div><label className="block text-sm font-medium mb-3" style={{ color: '#6b6860' }}>Available Slots</label>
                        {loading ? <div className="flex items-center gap-2 text-sm py-4" style={{ color: '#9c978f' }}><Loader2 size={14} className="animate-spin" /> Loading...</div>
                            : slots.length === 0 ? <div className="rounded-2xl p-5 text-center text-sm" style={{ ...cardStyle, color: '#6b6860' }}>No slots available.</div>
                                : <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{slots.map(slot => {
                                    const full = slot.booked_count >= slot.max_tokens || slot.isBlocked;
                                    return <button key={slot.id} disabled={full} onClick={() => setSelectedSlot(slot)} className="p-3 rounded-2xl text-sm text-center transition-all"
                                        style={selectedSlot?.id === slot.id ? { backgroundColor: '#d4613a', color: '#fff', border: '1px solid #d4613a' } : full ? { backgroundColor: '#f0ede6', color: '#d4ddd0', border: '1px solid #e8ede5' } : { ...cardStyle, color: '#1c1917' }}>
                                        <p className="font-semibold">{slot.slot_time}</p><p className="text-xs mt-0.5" style={{ color: selectedSlot?.id === slot.id ? 'rgba(255,255,255,0.7)' : full ? '#d4ddd0' : '#9c978f' }}>{full ? 'Full' : `${slot.max_tokens - slot.booked_count} left`}</p></button>;
                                })}</div>}
                        {selectedSlot && <button onClick={() => setStep(3)} className="mt-6 w-full text-white font-semibold py-3 rounded-full" style={{ backgroundColor: '#1c1917' }}>Continue →</button>}
                    </div>)}
                </div>)}

                {step === 3 && (<div className="animate-slide-up">
                    <button onClick={() => setStep(2)} className="text-sm mb-5 block hover:underline flex items-center gap-1" style={{ color: '#d4613a' }}><ChevronLeft size={14} /> Back</button>
                    <div className="rounded-3xl p-6 mb-6" style={cardStyle}>
                        <h2 className="text-lg font-bold mb-4" style={{ color: '#1c1917' }}>Booking Summary</h2>
                        {[
                            { l: 'Department', v: selectedDept?.department_name },
                            ...(selectedSubdivision ? [{ l: 'Service', v: selectedSubdivision }] : []),
                            { l: 'Location', v: selectedDept?.office_location },
                            { l: 'Date', v: selectedDate },
                            { l: 'Time Slot', v: selectedSlot?.slot_time },
                            { l: 'Citizen', v: userProfile?.name }
                        ].map(r => (
                            <div key={r.l} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid #e8ede5' }}>
                                <span className="text-sm" style={{ color: '#6b6860' }}>{r.l}</span>
                                <span className="font-medium text-sm text-right max-w-48" style={{ color: '#1c1917' }}>{r.v}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleBook} disabled={booking} className="w-full text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ backgroundColor: '#d4613a' }}>{booking ? <><Loader2 size={16} className="animate-spin" /> Booking...</> : <><Ticket size={16} /> Confirm & Book Token</>}</button>
                    <p className="text-center text-xs mt-3" style={{ color: '#9c978f' }}>By confirming, you agree to arrive 10 minutes before your slot.</p>
                </div>)}
            </div>
        </div>
    );
};

export default BookToken;