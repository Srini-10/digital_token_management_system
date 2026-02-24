import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDepartments, getSlotsForDepartmentDate, getHolidays, bookToken } from '../firebase/firestore';
import { autoSeedIfEmpty } from '../firebase/seedData';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STEPS = ['Department', 'Date & Slot', 'Confirm'];

const BookToken = () => {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [departments, setDepartments] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deptLoading, setDeptLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [bookedToken, setBookedToken] = useState(null);

    const today = format(new Date(), 'yyyy-MM-dd');
    const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

    const loadDepartments = async () => {
        setDeptLoading(true);
        try {
            const [depts, hols] = await Promise.all([getDepartments(), getHolidays()]);
            setDepartments(depts);
            setHolidays(hols.map(h => h.date));
        } catch (err) {
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

    const handleDateChange = (e) => {
        const d = e.target.value;
        if (isHoliday(d)) { toast.error('This date is a public holiday. Please select another date.'); return; }
        setSelectedDate(d);
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
                toast.error('Seeding failed. Make sure Firestore rules allow writes (use test mode).');
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
                slotTime: selectedSlot.slot_time,
                date: selectedDate,
            });
            setBookedToken(result);
            toast.success(`Token booked! Your number: ${result.tokenNumber}`);
            setStep(3);
        } catch (err) {
            toast.error(err.message || 'Booking failed. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    // Success screen
    if (step === 3 && bookedToken) {
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
                        <p className="text-sm font-medium text-gov-navy">{selectedDate} · {selectedSlot?.slot_time}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/token-history')}
                            className="flex-1 bg-gov-navy hover:bg-gov-blue text-white font-semibold py-3 rounded-xl transition-colors"
                        >
                            View My Tokens
                        </button>
                        <button
                            onClick={() => { setStep(0); setSelectedDept(null); setSelectedDate(''); setSelectedSlot(null); setBookedToken(null); }}
                            className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors"
                        >
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
            <div className="flex items-center mb-8">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i <= step ? 'bg-gov-navy text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {i < step ? '✓' : i + 1}
                        </div>
                        <span className={`ml-2 text-sm font-medium ${i === step ? 'text-gov-navy' : 'text-gray-400'}`}>{s}</span>
                        {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-gov-navy' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            {/* Step 0: Select Department */}
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
                            <button
                                onClick={handleSeedData}
                                disabled={seeding}
                                className="bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto"
                            >
                                {seeding ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading Demo Data...</>
                                ) : '🌱 Load Demo Departments & Slots'}
                            </button>
                            <p className="text-xs text-gray-400 mt-4">
                                Or ask Super Admin to add departments from the Super Admin Panel.
                            </p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                            {departments.map(dept => (
                                <button
                                    key={dept.id}
                                    onClick={() => { setSelectedDept(dept); setStep(1); }}
                                    className="bg-white hover:bg-gov-light border border-gray-200 hover:border-gov-blue rounded-xl p-4 text-left transition-all group"
                                >
                                    <p className="font-semibold text-gov-navy group-hover:text-gov-blue transition-colors">{dept.department_name}</p>
                                    <p className="text-gray-500 text-sm mt-1">📍 {dept.office_location}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 1: Date & Slot */}
            {step === 1 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep(0)} className="text-gov-blue hover:underline text-sm">← Back</button>
                        <div className="bg-gov-light border border-blue-100 rounded-xl px-4 py-2">
                            <span className="font-semibold text-gov-navy">{selectedDept?.department_name}</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                        <input
                            type="date"
                            min={today}
                            max={maxDate}
                            value={selectedDate}
                            onChange={handleDateChange}
                            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gov-blue text-sm"
                        />
                        {holidays.length > 0 && (
                            <p className="text-xs text-amber-600 mt-2">ℹ️ {holidays.length} holiday(s) are blocked this month.</p>
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
                                    No slots available for this date. Please select another date.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {slots.map(slot => {
                                        const full = slot.booked_count >= slot.max_tokens || slot.isBlocked;
                                        return (
                                            <button
                                                key={slot.id}
                                                disabled={full}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`p-3 rounded-xl border text-sm text-center transition-all ${selectedSlot?.id === slot.id
                                                        ? 'bg-gov-navy text-white border-gov-navy'
                                                        : full
                                                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                                            : 'bg-white hover:border-gov-blue hover:bg-gov-light border-gray-200 text-gov-navy'
                                                    }`}
                                            >
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
                                <button
                                    onClick={() => setStep(2)}
                                    className="mt-6 w-full bg-gov-navy hover:bg-gov-blue text-white font-semibold py-3 rounded-xl transition-colors"
                                >
                                    Continue →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && (
                <div className="animate-slide-up">
                    <button onClick={() => setStep(1)} className="text-gov-blue hover:underline text-sm mb-5 block">← Back</button>
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                        <h2 className="font-bold text-gov-navy text-lg mb-4">Booking Summary</h2>
                        {[
                            { label: 'Department', value: selectedDept?.department_name },
                            { label: 'Location', value: selectedDept?.office_location },
                            { label: 'Date', value: selectedDate },
                            { label: 'Time Slot', value: selectedSlot?.slot_time },
                            { label: 'Citizen Name', value: userProfile?.name },
                        ].map(r => (
                            <div key={r.label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                                <span className="text-gray-500 text-sm">{r.label}</span>
                                <span className="font-medium text-gov-navy text-sm text-right">{r.value}</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleBook}
                        disabled={booking}
                        className="w-full bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {booking ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Booking...</>
                        ) : '🎫 Confirm & Book Token'}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-3">
                        By confirming, you agree to arrive 10 minutes before your slot.
                    </p>
                </div>
            )}
        </div>
    );
};

export default BookToken;
