import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDepartments, getSlotsForDepartmentDate, getHolidays, bookToken } from '../firebase/firestore';
import { autoSeedIfEmpty } from '../firebase/seedData';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isBefore, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STEPS = ['Department', 'Service', 'Date & Slot', 'Confirm'];

const BookToken = () => {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [departments, setDepartments] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedSubdivision, setSelectedSubdivision] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deptLoading, setDeptLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [bookedToken, setBookedToken] = useState(null);

    const todayDate = startOfDay(new Date());
    const todayStr = format(todayDate, 'yyyy-MM-dd');
    const maxDate = format(addDays(todayDate, 30), 'yyyy-MM-dd');

    // ── Custom Calendar State ────────────────────────────────────────────────
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(todayDate));

    // Calendar generation logic
    const renderCalendarDays = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const days = [];
        let day = startDate;
        while (day <= endDate) {
            days.push(day);
            day = addDays(day, 1);
        }
        return days;
    };

    const loadDepartments = async () => {
        setDeptLoading(true);
        try {
            const [depts, hols] = await Promise.all([getDepartments(), getHolidays()]);
            setDepartments(depts);
            setHolidays(hols.map(h => h.date));
        } catch {
            toast.error('Failed to load departments. Check Firestore security rules.');
        } finally {
            setDeptLoading(false);
        }
    };

    useEffect(() => { loadDepartments(); }, []);

    useEffect(() => {
        if (selectedDept && selectedDate) {
            setLoading(true);
            getSlotsForDepartmentDate(selectedDept.id, selectedDate)
                .then(setSlots)
                .catch(() => toast.error('Failed to load slots'))
                .finally(() => setLoading(false));
        }
    }, [selectedDept, selectedDate]);

    const isHoliday = (date) => holidays.includes(date);

    const handleDateSelect = (dStr) => {
        if (isHoliday(dStr)) { toast.error('This date is a public holiday. Please select another date.'); return; }
        setSelectedDate(dStr);
        setSelectedSlot(null);
    };

    const handleSeedData = async () => {
        setSeeding(true);
        try {
            await autoSeedIfEmpty();
            await loadDepartments();
            const depts = await getDepartments();
            if (depts.length > 0) {
                toast.success(`${depts.length} departments loaded successfully!`);
            } else {
                toast.error('Seeding failed. Check Firestore rules (set to test mode).');
            }
        } catch (err) {
            toast.error('Could not seed data: ' + (err.message || 'Unknown error'));
        } finally {
            setSeeding(false);
        }
    };

    const handleBook = async () => {
        if (!selectedDept || !selectedDate || !selectedSlot) { toast.error('Please complete all selections'); return; }
        setBooking(true);
        try {
            const deptCode = selectedDept.department_name.split(' ')[0].substring(0, 3).toUpperCase();
            const result = await bookToken({
                userId: currentUser.uid,
                departmentId: selectedDept.id,
                slotId: selectedSlot.id,
                departmentCode: deptCode,
                userName: userProfile?.name || currentUser.displayName,
                departmentName: selectedDept.department_name,
                subdivision: selectedSubdivision || null,
                slotTime: selectedSlot.slot_time,
                date: selectedDate,
            });
            setBookedToken(result);
            toast.success(`Token booked! Your number: ${result.tokenNumber}`);
            setStep(4);
        } catch (err) {
            toast.error(err.message || 'Booking failed. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    // Success screen
    if (step === 4 && bookedToken) {
        return (
            <div className="max-w-lg mx-auto px-4 py-10 text-center animate-slide-up">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✅</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gov-navy mb-2">Token Booked!</h2>
                    <p className="text-gray-500 mb-6">Your appointment has been confirmed.</p>
                    <div className="bg-gov-light rounded-2xl p-6 mb-6">
                        <p className="text-sm text-gray-500 mb-1">Your Token Number</p>
                        <p className="text-3xl font-extrabold text-gov-blue">{bookedToken.tokenNumber}</p>
                        <p className="text-sm text-gray-500 mt-3">{selectedDept?.department_name}</p>
                        {selectedSubdivision && (
                            <p className="text-xs text-gov-blue font-medium mt-0.5">📋 {selectedSubdivision}</p>
                        )}
                        <p className="text-sm font-medium text-gov-navy mt-1">{selectedDate} · {selectedSlot?.slot_time}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/token-history')}
                            className="flex-1 bg-gov-navy hover:bg-gov-blue text-white font-semibold py-3 rounded-xl transition-colors">
                            View My Tokens
                        </button>
                        <button onClick={() => { setStep(0); setSelectedDept(null); setSelectedSubdivision(''); setSelectedDate(''); setSelectedSlot(null); setBookedToken(null); }}
                            className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors">
                            Book Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gov-navy mb-6">Book a Token</h1>

            {/* Stepper */}
            <div className="flex items-center mb-8 overflow-x-auto pb-1">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center flex-1 last:flex-none min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${i <= step ? 'bg-gov-navy text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {i < step ? '✓' : i + 1}
                        </div>
                        <span className={`ml-2 text-sm font-medium whitespace-nowrap ${i === step ? 'text-gov-navy' : 'text-gray-400'}`}>{s}</span>
                        {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 min-w-4 ${i < step ? 'bg-gov-navy' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            {/* ── Step 0: Department ──────────────────────────────────── */}
            {step === 0 && (
                <div>
                    <p className="text-gray-600 mb-4 text-sm">Select the government department you want to visit:</p>
                    {deptLoading ? (
                        <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
                            <div className="w-6 h-6 border-2 border-gov-blue border-t-transparent rounded-full animate-spin" />
                            <span>Loading departments...</span>
                        </div>
                    ) : departments.length === 0 ? (
                        <div className="text-center py-14 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-5xl mb-3">🏢</p>
                            <p className="font-semibold text-gov-navy mb-1">No Departments Found</p>
                            <p className="text-gray-400 text-sm mb-6 px-6">
                                The system has no departments configured yet. Click below to load demo Tamil Nadu government departments.
                            </p>
                            <button onClick={handleSeedData} disabled={seeding}
                                className="bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto">
                                {seeding ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading...</> : '🌱 Load Demo Departments & Slots'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                            {departments.map(dept => (
                                <button key={dept.id}
                                    onClick={() => { setSelectedDept(dept); setSelectedSubdivision(''); setStep(1); }}
                                    className="bg-white hover:bg-gov-light border border-gray-200 hover:border-gov-blue rounded-xl p-4 text-left transition-all group">
                                    <p className="font-semibold text-gov-navy group-hover:text-gov-blue transition-colors">{dept.department_name}</p>
                                    <p className="text-gray-500 text-xs mt-1">📍 {dept.office_location}</p>
                                    {dept.subdivisions?.length > 0 && (
                                        <p className="text-blue-400 text-xs mt-2">{dept.subdivisions.length} services available →</p>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Step 1: Sub-division / Service ─────────────────────── */}
            {step === 1 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep(0)} className="text-gov-blue hover:underline text-sm">← Back</button>
                        <div className="bg-gov-light border border-blue-100 rounded-xl px-4 py-2">
                            <span className="font-semibold text-gov-navy">{selectedDept?.department_name}</span>
                        </div>
                    </div>

                    <p className="text-gray-600 mb-4 text-sm font-medium">What service do you need?</p>

                    {selectedDept?.subdivisions?.length > 0 ? (
                        <div className="space-y-2 mb-6">
                            {/* Option: No specific subdivision */}
                            <button
                                onClick={() => { setSelectedSubdivision(''); setStep(2); }}
                                className="w-full bg-white border border-dashed border-gray-300 hover:border-gov-blue hover:bg-gov-light rounded-xl p-3 text-left transition-all text-sm text-gray-500 hover:text-gov-navy">
                                🔹 General Visit / Not listed
                            </button>
                            {selectedDept.subdivisions.map(sub => (
                                <button key={sub}
                                    onClick={() => { setSelectedSubdivision(sub); setStep(2); }}
                                    className={`w-full bg-white border rounded-xl p-3.5 text-left transition-all text-sm font-medium hover:border-gov-blue hover:bg-gov-light ${selectedSubdivision === sub ? 'border-gov-navy bg-gov-light text-gov-navy' : 'border-gray-200 text-gray-700'}`}>
                                    📋 {sub}
                                </button>
                            ))}
                        </div>
                    ) : (
                        // No sub-divisions defined — skip directly
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 text-sm text-blue-700">
                            No specific services listed for this department. Proceeding to date & slot selection.
                            <button onClick={() => setStep(2)} className="block mt-3 bg-gov-navy text-white px-6 py-2 rounded-xl font-medium hover:bg-gov-blue transition-colors">
                                Continue →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Step 2: Date & Slot ────────────────────────────────── */}
            {step === 2 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep(1)} className="text-gov-blue hover:underline text-sm">← Back</button>
                        <div className="flex gap-2 flex-wrap">
                            <div className="bg-gov-light border border-blue-100 rounded-xl px-3 py-1.5">
                                <span className="font-semibold text-gov-navy text-sm">{selectedDept?.department_name}</span>
                            </div>
                            {selectedSubdivision && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5">
                                    <span className="text-gov-blue text-sm">📋 {selectedSubdivision}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Select Date</label>

                        {/* Custom Inline Calendar */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm max-w-sm mx-auto sm:mx-0">
                            {/* Calendar Header */}
                            <div className="flex justify-between items-center mb-4">
                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    disabled={isBefore(currentMonth, startOfMonth(todayDate))}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                                    ←
                                </button>
                                <h3 className="font-bold text-gov-navy">{format(currentMonth, 'MMMM yyyy')}</h3>
                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                    →
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                    <div key={d} className="text-xs font-semibold text-gray-400 py-1">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {renderCalendarDays().map((day, i) => {
                                    const dStr = format(day, 'yyyy-MM-dd');
                                    const isSelected = selectedDate === dStr;
                                    const isPast = isBefore(day, todayDate);
                                    const isTooFar = dStr > maxDate;
                                    const isCurrentMonth = isSameMonth(day, currentMonth);
                                    const isHol = isHoliday(dStr);
                                    const isDisabled = isPast || isTooFar || isHol;

                                    return (
                                        <button
                                            key={i}
                                            disabled={isDisabled}
                                            onClick={() => handleDateSelect(dStr)}
                                            className={`
                                                aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all
                                                ${!isCurrentMonth ? 'text-gray-300' : ''}
                                                ${isSelected ? 'bg-gov-navy text-white shadow-md scale-110' : ''}
                                                ${!isSelected && !isDisabled ? 'hover:bg-gov-light hover:text-gov-blue text-gray-700' : ''}
                                                ${isDisabled && !isPast && !isTooFar && isHol ? 'bg-red-50 text-red-300 line-through cursor-not-allowed' : ''}
                                                ${isPast || isTooFar ? 'opacity-30 cursor-not-allowed' : ''}
                                            `}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {holidays.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-amber-600 mt-3 bg-amber-50 p-2.5 rounded-xl border border-amber-100 max-w-sm">
                                <span>🛑</span> <p>{holidays.length} holiday(s) are blocked (marked in red).</p>
                            </div>
                        )}
                    </div>

                    {selectedDate && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Available Time Slots</label>
                            {loading ? (
                                <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                                    <div className="w-4 h-4 border-2 border-gov-blue border-t-transparent rounded-full animate-spin" /> Loading slots...
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center text-amber-700 text-sm">
                                    No slots available for this date. Please select another date or ask the admin to add slots.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {slots.map(slot => {
                                        const full = slot.booked_count >= slot.max_tokens || slot.isBlocked;
                                        return (
                                            <button key={slot.id} disabled={full} onClick={() => setSelectedSlot(slot)}
                                                className={`p-3 rounded-xl border text-sm text-center transition-all ${selectedSlot?.id === slot.id
                                                    ? 'bg-gov-navy text-white border-gov-navy'
                                                    : full
                                                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                                        : 'bg-white hover:border-gov-blue hover:bg-gov-light border-gray-200 text-gov-navy'}`}>
                                                <p className="font-semibold">{slot.slot_time}</p>
                                                <p className={`text-xs mt-0.5 ${selectedSlot?.id === slot.id ? 'text-blue-200' : full ? 'text-gray-300' : 'text-gray-400'}`}>
                                                    {full ? 'Full' : `${slot.max_tokens - slot.booked_count} left`}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {selectedSlot && (
                                <button onClick={() => setStep(3)} className="mt-6 w-full bg-gov-navy hover:bg-gov-blue text-white font-semibold py-3 rounded-xl transition-colors">
                                    Continue →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Step 3: Confirm ────────────────────────────────────── */}
            {step === 3 && (
                <div className="animate-slide-up">
                    <button onClick={() => setStep(2)} className="text-gov-blue hover:underline text-sm mb-5 block">← Back</button>
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                        <h2 className="font-bold text-gov-navy text-lg mb-4">Booking Summary</h2>
                        {[
                            { label: 'Department', value: selectedDept?.department_name },
                            ...(selectedSubdivision ? [{ label: 'Service', value: selectedSubdivision }] : []),
                            { label: 'Location', value: selectedDept?.office_location },
                            { label: 'Date', value: selectedDate },
                            { label: 'Time Slot', value: selectedSlot?.slot_time },
                            { label: 'Citizen Name', value: userProfile?.name },
                        ].map(r => (
                            <div key={r.label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                                <span className="text-gray-500 text-sm">{r.label}</span>
                                <span className="font-medium text-gov-navy text-sm text-right max-w-48">{r.value}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleBook} disabled={booking}
                        className="w-full bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                        {booking ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Booking...</> : '🎫 Confirm & Book Token'}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-3">By confirming, you agree to arrive 10 minutes before your slot.</p>
                </div>
            )}
        </div>
    );
};

export default BookToken;
