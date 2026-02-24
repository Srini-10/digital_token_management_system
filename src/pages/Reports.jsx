import { useEffect, useState } from 'react';
import { getDepartments, getTokensByDepartmentDate } from '../firebase/firestore';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#1d4ed8', '#16a34a', '#dc2626', '#d97706'];

const Reports = () => {
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { getDepartments(false).then(setDepartments); }, []);

    const fetchReport = async () => {
        if (!selectedDept || !selectedDate) { toast.error('Select department and date'); return; }
        setLoading(true);
        try {
            const data = await getTokensByDepartmentDate(selectedDept, selectedDate);
            setTokens(data);
        } catch {
            toast.error('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: tokens.length,
        pending: tokens.filter(t => t.status === 'pending').length,
        completed: tokens.filter(t => t.status === 'completed').length,
        cancelled: tokens.filter(t => t.status === 'cancelled').length,
        called: tokens.filter(t => t.status === 'called').length,
    };

    const pieData = [
        { name: 'Completed', value: stats.completed },
        { name: 'Pending', value: stats.pending },
        { name: 'Cancelled', value: stats.cancelled },
        { name: 'Called', value: stats.called },
    ].filter(d => d.value > 0);

    // Slot-wise analysis
    const slotStats = tokens.reduce((acc, t) => {
        acc[t.slot_time] = acc[t.slot_time] || { slot: t.slot_time, total: 0, completed: 0 };
        acc[t.slot_time].total++;
        if (t.status === 'completed') acc[t.slot_time].completed++;
        return acc;
    }, {});
    const barData = Object.values(slotStats).sort((a, b) => a.slot.localeCompare(b.slot));

    const exportCSV = () => {
        const headers = 'Token Number,Citizen Name,Department,Status,Slot Time,Date\n';
        const rows = tokens.map(t =>
            `${t.token_number},${t.user_name},${t.department_name},${t.status},${t.slot_time},${t.booking_date}`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${selectedDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV downloaded!');
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gov-navy mb-6">Reports & Analytics</h1>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                        <select
                            value={selectedDept}
                            onChange={e => setSelectedDept(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue min-w-[180px]"
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
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue"
                        />
                    </div>
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                    >
                        {loading ? 'Loading...' : 'Generate Report'}
                    </button>
                    {tokens.length > 0 && (
                        <button
                            onClick={exportCSV}
                            className="border border-gov-blue text-gov-blue hover:bg-gov-light text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                        >
                            📥 Export CSV
                        </button>
                    )}
                </div>
            </div>

            {tokens.length > 0 && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Bookings', value: stats.total, color: 'text-gov-blue' },
                            { label: 'Completed', value: stats.completed, color: 'text-green-600' },
                            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
                            { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                                <p className="text-gray-500 text-sm mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid lg:grid-cols-2 gap-6 mb-6">
                        {barData.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                <h2 className="font-semibold text-gov-navy mb-4">Slot-wise Bookings</h2>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="slot" fontSize={11} />
                                        <YAxis fontSize={11} />
                                        <Tooltip />
                                        <Bar dataKey="total" name="Total" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="completed" name="Completed" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {pieData.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                <h2 className="font-semibold text-gov-navy mb-4">Status Distribution</h2>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Token Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50">
                            <h2 className="font-semibold text-gov-navy">All Tokens for {selectedDate}</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gov-light border-b border-gray-100 text-left">
                                        {['Token No.', 'Citizen', 'Slot', 'Status'].map(h => (
                                            <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {tokens.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 font-bold text-gov-blue text-sm">{t.token_number}</td>
                                            <td className="px-5 py-3 text-gov-navy text-sm">{t.user_name}</td>
                                            <td className="px-5 py-3 text-gray-500 text-sm">{t.slot_time}</td>
                                            <td className="px-5 py-3">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize
                          ${t.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200'
                                                        : t.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                            : t.status === 'called' ? 'bg-blue-100 text-blue-800 border-blue-200'
                                                                : 'bg-red-100 text-red-800 border-red-200'}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {tokens.length === 0 && !loading && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <p className="text-5xl mb-3">📊</p>
                    <p className="text-gray-500">Select a department and date, then click Generate Report</p>
                </div>
            )}
        </div>
    );
};

export default Reports;
