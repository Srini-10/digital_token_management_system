import { useEffect, useState } from 'react';
import { getDepartments, getSlotsForDepartmentDate, addSlot, updateSlot, deleteSlot, getHolidays, addHoliday, deleteHoliday } from '../firebase/firestore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ManageSlots = () => {
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [slots, setSlots] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('slots');
    const [newSlot, setNewSlot] = useState({ slot_time: '', max_tokens: 10 });
    const [holidayForm, setHolidayForm] = useState({ date: '', reason: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getDepartments(false).then(setDepartments);
        getHolidays().then(setHolidays);
    }, []);

    useEffect(() => {
        if (selectedDept && selectedDate) {
            setLoading(true);
            getSlotsForDepartmentDate(selectedDept, selectedDate)
                .then(setSlots)
                .finally(() => setLoading(false));
        }
    }, [selectedDept, selectedDate]);

    const handleAddSlot = async (e) => {
        e.preventDefault();
        if (!selectedDept || !selectedDate) { toast.error('Select a department and date first'); return; }
        if (!newSlot.slot_time) { toast.error('Enter a slot time'); return; }
        setSaving(true);
        try {
            await addSlot({ department_id: selectedDept, date: selectedDate, slot_time: newSlot.slot_time, max_tokens: Number(newSlot.max_tokens) });
            toast.success('Slot added');
            setNewSlot({ slot_time: '', max_tokens: 10 });
            getSlotsForDepartmentDate(selectedDept, selectedDate).then(setSlots);
        } catch {
            toast.error('Failed to add slot');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSlot = async (id) => {
        if (!window.confirm('Delete this slot?')) return;
        try {
            await deleteSlot(id);
            toast.success('Slot deleted');
            setSlots(slots.filter(s => s.id !== id));
        } catch {
            toast.error('Failed to delete slot');
        }
    };

    const handleToggleBlock = async (slot) => {
        try {
            await updateSlot(slot.id, { isBlocked: !slot.isBlocked });
            toast.success(slot.isBlocked ? 'Slot unblocked' : 'Slot blocked');
            setSlots(slots.map(s => s.id === slot.id ? { ...s, isBlocked: !s.isBlocked } : s));
        } catch {
            toast.error('Failed to update slot');
        }
    };

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        if (!holidayForm.date || !holidayForm.reason) { toast.error('Fill date and reason'); return; }
        setSaving(true);
        try {
            const ref = await addHoliday(holidayForm.date, holidayForm.reason);
            toast.success('Holiday added');
            setHolidays([...holidays, { id: ref.id, ...holidayForm }]);
            setHolidayForm({ date: '', reason: '' });
        } catch {
            toast.error('Failed to add holiday');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteHoliday = async (id) => {
        try {
            await deleteHoliday(id);
            setHolidays(holidays.filter(h => h.id !== id));
            toast.success('Holiday removed');
        } catch {
            toast.error('Failed to remove holiday');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gov-navy mb-6">Manage Slots & Holidays</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {['slots', 'holidays'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-gov-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gov-blue'}`}
                    >
                        {tab === 'slots' ? '🕐 Time Slots' : '🗓️ Holidays'}
                    </button>
                ))}
            </div>

            {/* Slots Tab */}
            {activeTab === 'slots' && (
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h2 className="font-semibold text-gov-navy mb-4">Filters</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                                    <select
                                        value={selectedDept}
                                        onChange={e => setSelectedDept(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue"
                                    >
                                        <option value="">-- Select --</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue"
                                    />
                                </div>
                            </div>

                            {/* Add Slot Form */}
                            {selectedDept && selectedDate && (
                                <form onSubmit={handleAddSlot} className="mt-5 pt-5 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gov-navy mb-3">Add New Slot</h3>
                                    <div className="space-y-2.5">
                                        <input
                                            type="time"
                                            value={newSlot.slot_time}
                                            onChange={e => setNewSlot(p => ({ ...p, slot_time: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue"
                                            placeholder="Slot time"
                                        />
                                        <input
                                            type="number"
                                            value={newSlot.max_tokens}
                                            onChange={e => setNewSlot(p => ({ ...p, max_tokens: e.target.value }))}
                                            min="1" max="100"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue"
                                            placeholder="Max tokens"
                                        />
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="w-full bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                                        >
                                            {saving ? 'Adding...' : '+ Add Slot'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                                <h2 className="font-semibold text-gov-navy">
                                    {selectedDept ? `Slots for ${selectedDate}` : 'Select a department & date'}
                                </h2>
                                <span className="text-xs text-gray-400">{slots.length} slots</span>
                            </div>
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-gov-blue border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-sm">
                                    {selectedDept ? 'No slots for this date.' : 'Select a department to view slots.'}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {slots.map(slot => (
                                        <div key={slot.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                                            <div>
                                                <p className="font-semibold text-gov-navy">{slot.slot_time}</p>
                                                <p className="text-xs text-gray-500">
                                                    {slot.booked_count}/{slot.max_tokens} booked
                                                    {slot.isBlocked && <span className="ml-2 text-red-600 font-medium">• Blocked</span>}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                                    <div
                                                        className="bg-gov-blue h-1.5 rounded-full"
                                                        style={{ width: `${Math.min(100, (slot.booked_count / slot.max_tokens) * 100)}%` }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleToggleBlock(slot)}
                                                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${slot.isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                                                >
                                                    {slot.isBlocked ? 'Unblock' : 'Block'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                    className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Holidays Tab */}
            {activeTab === 'holidays' && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <h2 className="font-semibold text-gov-navy mb-4">Add Holiday</h2>
                        <form onSubmit={handleAddHoliday} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={holidayForm.date}
                                    onChange={e => setHolidayForm(p => ({ ...p, date: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                                <input
                                    type="text"
                                    value={holidayForm.reason}
                                    onChange={e => setHolidayForm(p => ({ ...p, reason: e.target.value }))}
                                    placeholder="e.g. Republic Day"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                            >
                                {saving ? 'Adding...' : '+ Add Holiday'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50">
                            <h2 className="font-semibold text-gov-navy">Blocked Holidays ({holidays.length})</h2>
                        </div>
                        {holidays.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm">No holidays added.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {holidays.map(h => (
                                    <div key={h.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                                        <div>
                                            <p className="font-medium text-gov-navy text-sm">{h.date}</p>
                                            <p className="text-gray-500 text-xs">{h.reason}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteHoliday(h.id)}
                                            className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg font-medium transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSlots;
