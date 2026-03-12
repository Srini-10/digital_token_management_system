import { Link } from 'react-router-dom';
import { Ticket, Timer, FileText, CalendarDays, BarChart3, ShieldCheck, Car, ClipboardList, Building2, Plane, CreditCard, Briefcase, Radio, CheckCircle } from 'lucide-react';

const features = [
    { icon: <Ticket size={24} />, title: 'Digital Token Booking', desc: 'Book appointments online from anywhere, anytime. No need to stand in physical queues.' },
    { icon: <Timer size={24} />, title: 'Real-Time Updates', desc: 'Live token display screen shows current status. Know exactly when your turn is approaching.' },
    { icon: <FileText size={24} />, title: 'PDF Token Download', desc: 'Download your token as a printable PDF with QR code for easy verification at the counter.' },
    { icon: <CalendarDays size={24} />, title: 'Slot Management', desc: 'Admins can create time slots, set capacity limits, and block holidays effortlessly.' },
    { icon: <BarChart3 size={24} />, title: 'Analytics Dashboard', desc: 'Comprehensive reports on daily bookings, peak times, and department-wise statistics.' },
    { icon: <ShieldCheck size={24} />, title: 'Secure & Role-Based', desc: 'Firebase Auth with role-based access control for citizens, admins, and super admins.' },
];

const departments = [
    { name: 'RTO Office', icon: <Car size={24} />, desc: 'Vehicle registration, driving licence, permits' },
    { name: 'Revenue Office', icon: <ClipboardList size={24} />, desc: 'Land records, certificates, tax payments' },
    { name: 'Municipal Office', icon: <Building2 size={24} />, desc: 'Birth/death certificates, property tax' },
    { name: 'Passport Seva', icon: <Plane size={24} />, desc: 'Passport application & renewal' },
    { name: 'Aadhaar Centre', icon: <CreditCard size={24} />, desc: 'Aadhaar enrolment & updates' },
    { name: 'Employment Office', icon: <Briefcase size={24} />, desc: 'Job registrations & certificates' },
];

const Home = () => {
    return (
        <div className="animate-fade-in" style={{ backgroundColor: '#f0ede6', minHeight: '100vh' }}>
            {/* Hero */}
            <section className="relative overflow-hidden" style={{ backgroundColor: '#1c1917' }}>
                <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #d4ddd0 0%, transparent 50%), radial-gradient(circle at 80% 20%, #d4613a 0%, transparent 40%)' }} />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6" style={{ backgroundColor: 'rgba(212,221,208,0.12)', border: '1px solid rgba(212,221,208,0.25)' }}>
                            <Radio size={10} className="text-green-400 animate-pulse" />
                            <span className="text-sm font-medium" style={{ color: '#d4ddd0' }}>Live Token System Active</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6" style={{ color: '#f5f2ec' }}>
                            Government Services,{' '}<span style={{ color: '#d4613a' }}>No More Queues</span>
                        </h1>
                        <p className="text-lg max-w-xl mx-auto lg:mx-0 mb-8" style={{ color: '#d4ddd0' }}>
                            Book digital appointment tokens for any government department. Get real-time updates, PDF tokens with QR codes, and visit only at your scheduled time.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link to="/register" className="font-bold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 text-center text-white transition-all" style={{ backgroundColor: '#d4613a' }}>Book a Token Now</Link>
                            <Link to="/live" className="font-semibold px-8 py-3.5 rounded-full text-center flex items-center gap-2 justify-center transition-all" style={{ border: '1px solid rgba(212,221,208,0.35)', color: '#d4ddd0' }}>
                                <Radio size={10} className="text-red-400 animate-pulse" /> Live Display Screen
                            </Link>
                        </div>
                    </div>
                    <div className="flex-1 max-w-sm w-full">
                        <div className="rounded-3xl shadow-2xl p-6 relative" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#d4613a' }}><span className="font-bold text-sm text-white">GT</span></div>
                                <div><p className="text-sm font-semibold" style={{ color: '#1c1917' }}>Government of Tamil Nadu</p><p className="text-xs" style={{ color: '#9c978f' }}>Digital Token System</p></div>
                            </div>
                            <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#f0ede6', border: '1px solid #d4ddd0' }}>
                                <p className="text-xs mb-1" style={{ color: '#9c978f' }}>Department</p><p className="font-semibold" style={{ color: '#1c1917' }}>RTO Office – Chennai</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="rounded-2xl p-3" style={{ backgroundColor: '#f0ede6', border: '1px solid #d4ddd0' }}><p className="text-xs mb-1" style={{ color: '#9c978f' }}>Token No.</p><p className="font-bold text-lg" style={{ color: '#d4613a' }}>RTO-2026-045</p></div>
                                <div className="rounded-2xl p-3" style={{ backgroundColor: '#f0ede6', border: '1px solid #d4ddd0' }}><p className="text-xs mb-1" style={{ color: '#9c978f' }}>Time Slot</p><p className="font-semibold text-sm" style={{ color: '#1c1917' }}>10:30 AM</p></div>
                            </div>
                            <div className="flex items-center gap-2 rounded-2xl p-3" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                                <CheckCircle size={20} style={{ color: '#059669' }} />
                                <div><p className="font-semibold text-sm" style={{ color: '#065f46' }}>CONFIRMED</p><p className="text-xs" style={{ color: '#059669' }}>Please arrive 10 mins early</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #d4ddd0' }}>
                <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {[{ label: 'Departments', value: '20+' }, { label: 'Tokens Issued Daily', value: '5,000+' }, { label: 'Citizens Served', value: '1L+' }, { label: 'Avg Wait Time', value: '< 5 min' }].map(s => (
                        <div key={s.label}><p className="text-3xl font-extrabold" style={{ color: '#1c1917' }}>{s.value}</p><p className="text-sm mt-1" style={{ color: '#9c978f' }}>{s.label}</p></div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-3" style={{ color: '#1c1917' }}>Why Use GovToken?</h2>
                    <p className="max-w-xl mx-auto" style={{ color: '#9c978f' }}>A modern solution to eliminate waiting times at government offices across Tamil Nadu.</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map(f => (
                        <div key={f.title} className="rounded-3xl p-6 transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: '#ffffff', border: '1px solid #d4ddd0' }}>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#f0ede6', color: '#d4613a' }}>{f.icon}</div>
                            <h3 className="font-semibold mb-2 text-lg" style={{ color: '#1c1917' }}>{f.title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: '#6b6860' }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Departments */}
            <section className="py-16" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #d4ddd0', borderBottom: '1px solid #d4ddd0' }}>
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold mb-3" style={{ color: '#1c1917' }}>Available Departments</h2>
                        <p style={{ color: '#9c978f' }}>Book tokens for any of these government departments</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {departments.map(d => (
                            <div key={d.name} className="rounded-3xl p-5 flex items-start gap-4" style={{ backgroundColor: '#f0ede6', border: '1px solid #d4ddd0' }}>
                                <div className="mt-0.5" style={{ color: '#d4613a' }}>{d.icon}</div>
                                <div><p className="font-semibold" style={{ color: '#1c1917' }}>{d.name}</p><p className="text-sm mt-0.5" style={{ color: '#6b6860' }}>{d.desc}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center mb-12"><h2 className="text-3xl font-bold mb-3" style={{ color: '#1c1917' }}>How It Works</h2><p style={{ color: '#9c978f' }}>Simple 4-step process to book your appointment</p></div>
                <div className="flex flex-col md:flex-row items-start gap-6 justify-center">
                    {[{ step: '01', title: 'Register', desc: 'Create your account with your email and mobile number.' }, { step: '02', title: 'Select Department', desc: 'Choose the government department you need to visit.' }, { step: '03', title: 'Book Slot', desc: 'Pick a convenient date and available time slot.' }, { step: '04', title: 'Visit & Done', desc: 'Arrive at your slot time with your digital token.' }].map(s => (
                        <div key={s.step} className="flex flex-col items-center text-center flex-1">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg" style={{ backgroundColor: '#d4613a' }}>{s.step}</div>
                            <h3 className="font-semibold mb-1 text-lg" style={{ color: '#1c1917' }}>{s.title}</h3><p className="text-sm" style={{ color: '#9c978f' }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="py-12" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #d4ddd0' }}>
                <div className="max-w-3xl mx-auto text-center px-4">
                    <h2 className="text-2xl font-bold mb-3" style={{ color: '#1c1917' }}>Ready to skip the queue?</h2>
                    <p className="mb-6" style={{ color: '#9c978f' }}>Register now and book your first token in under 2 minutes.</p>
                    <Link to="/register" className="text-white font-bold px-10 py-3.5 rounded-full shadow-lg inline-block hover:scale-105 transition-all" style={{ backgroundColor: '#d4613a' }}>Get Started – It's Free</Link>
                </div>
            </section>
            <footer className="text-center py-6 text-sm" style={{ backgroundColor: '#1c1917', color: '#9c978f' }}><p>&copy; 2026 GovToken – Government of Tamil Nadu Digital Services.</p></footer>
        </div>
    );
};

export default Home;
