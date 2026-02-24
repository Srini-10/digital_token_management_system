import { Link } from 'react-router-dom';

const features = [
    { icon: '🎫', title: 'Digital Token Booking', desc: 'Book appointments online from anywhere, anytime. No need to stand in physical queues.' },
    { icon: '⏱️', title: 'Real-Time Updates', desc: 'Live token display screen shows current status. Know exactly when your turn is approaching.' },
    { icon: '📄', title: 'PDF Token Download', desc: 'Download your token as a printable PDF with QR code for easy verification at the counter.' },
    { icon: '📅', title: 'Slot Management', desc: 'Admins can create time slots, set capacity limits, and block holidays effortlessly.' },
    { icon: '📊', title: 'Analytics Dashboard', desc: 'Comprehensive reports on daily bookings, peak times, and department-wise statistics.' },
    { icon: '🔒', title: 'Secure & Role-Based', desc: 'Firebase Auth with role-based access control for citizens, admins, and super admins.' },
];

const departments = [
    { name: 'RTO Office', icon: '🚗', desc: 'Vehicle registration, driving licence, permits' },
    { name: 'Revenue Office', icon: '📋', desc: 'Land records, certificates, tax payments' },
    { name: 'Municipal Office', icon: '🏢', desc: 'Birth/death certificates, property tax' },
    { name: 'Passport Seva', icon: '✈️', desc: 'Passport application & renewal' },
    { name: 'Aadhaar Centre', icon: '🪪', desc: 'Aadhaar enrolment & updates' },
    { name: 'Employment Office', icon: '💼', desc: 'Job registrations & certificates' },
];

const Home = () => {
    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="relative bg-gov-navy overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #3b82f6 0%, transparent 60%), radial-gradient(circle at 80% 20%, #d4a017 0%, transparent 50%)' }}
                />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-blue-800/50 border border-blue-600 rounded-full px-4 py-1.5 mb-6">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow" />
                            <span className="text-blue-200 text-sm font-medium">Live Token System Active</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                            Government Services,{' '}
                            <span className="text-gov-gold">No More Queues</span>
                        </h1>
                        <p className="text-blue-200 text-lg max-w-xl mx-auto lg:mx-0 mb-8">
                            Book digital appointment tokens for any government department. Get real-time updates,
                            PDF tokens with QR codes, and visit only at your scheduled time.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                to="/register"
                                className="bg-gov-gold hover:bg-yellow-400 text-gov-navy font-bold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 text-center"
                            >
                                Book a Token Now
                            </Link>
                            <Link
                                to="/live"
                                className="border-2 border-blue-400 text-blue-200 hover:bg-blue-800 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-center flex items-center gap-2 justify-center"
                            >
                                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                                Live Display Screen
                            </Link>
                        </div>
                    </div>

                    {/* Hero card mockup */}
                    <div className="flex-1 max-w-sm w-full">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 border-t-4 border-gov-gold relative">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-gov-navy rounded-full flex items-center justify-center">
                                    <span className="text-gov-gold font-bold text-sm">GT</span>
                                </div>
                                <div>
                                    <p className="font-bold text-gov-navy text-sm">Government of Tamil Nadu</p>
                                    <p className="text-gray-500 text-xs">Digital Token System</p>
                                </div>
                            </div>
                            <div className="bg-gov-light rounded-xl p-4 mb-4 border border-blue-100">
                                <p className="text-xs text-gray-500 mb-1">Department</p>
                                <p className="font-semibold text-gov-navy">RTO Office – Chennai</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-gov-light rounded-xl p-3 border border-blue-100">
                                    <p className="text-xs text-gray-500 mb-1">Token No.</p>
                                    <p className="font-bold text-gov-blue text-lg">RTO-2026-045</p>
                                </div>
                                <div className="bg-gov-light rounded-xl p-3 border border-blue-100">
                                    <p className="text-xs text-gray-500 mb-1">Time Slot</p>
                                    <p className="font-semibold text-gov-navy text-sm">10:30 AM</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                                <span className="text-green-600 text-lg">✅</span>
                                <div>
                                    <p className="text-green-800 font-semibold text-sm">CONFIRMED</p>
                                    <p className="text-green-600 text-xs">Please arrive 10 mins early</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {[
                        { label: 'Departments', value: '20+' },
                        { label: 'Tokens Issued Daily', value: '5,000+' },
                        { label: 'Citizens Served', value: '1L+' },
                        { label: 'Avg Wait Time', value: '< 5 min' },
                    ].map((s) => (
                        <div key={s.label}>
                            <p className="text-3xl font-extrabold text-gov-blue">{s.value}</p>
                            <p className="text-gray-500 text-sm mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gov-navy mb-3">Why Use GovToken?</h2>
                    <p className="text-gray-500 max-w-xl mx-auto">A modern solution to eliminate waiting times at government offices across Tamil Nadu.</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f) => (
                        <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 group">
                            <div className="w-12 h-12 bg-gov-light rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-blue-100 transition-colors">
                                {f.icon}
                            </div>
                            <h3 className="font-semibold text-gov-navy mb-2">{f.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Departments */}
            <section className="bg-gov-navy py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white mb-3">Available Departments</h2>
                        <p className="text-blue-300">Book tokens for any of these government departments</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {departments.map((d) => (
                            <div key={d.name} className="bg-blue-900/50 border border-blue-700 rounded-xl p-5 flex items-start gap-4 hover:bg-blue-800/50 transition-colors">
                                <span className="text-3xl">{d.icon}</span>
                                <div>
                                    <p className="text-white font-semibold">{d.name}</p>
                                    <p className="text-blue-300 text-sm mt-0.5">{d.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gov-navy mb-3">How It Works</h2>
                    <p className="text-gray-500">Simple 4-step process to book your appointment</p>
                </div>
                <div className="flex flex-col md:flex-row items-start gap-6 justify-center">
                    {[
                        { step: '01', title: 'Register', desc: 'Create your account with your email and mobile number.' },
                        { step: '02', title: 'Select Department', desc: 'Choose the government department you need to visit.' },
                        { step: '03', title: 'Book Slot', desc: 'Pick a convenient date and available time slot.' },
                        { step: '04', title: 'Visit & Done', desc: 'Arrive at your slot time with your digital token.' },
                    ].map((s, i) => (
                        <div key={s.step} className="flex flex-col items-center text-center flex-1">
                            <div className="w-14 h-14 bg-gov-blue rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg">
                                {s.step}
                            </div>
                            {i < 3 && <div className="hidden md:block absolute translate-x-24 w-16 border-t-2 border-dashed border-blue-200" />}
                            <h3 className="font-semibold text-gov-navy mb-1">{s.title}</h3>
                            <p className="text-gray-500 text-sm">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="bg-gov-light border-t border-blue-100 py-12">
                <div className="max-w-3xl mx-auto text-center px-4">
                    <h2 className="text-2xl font-bold text-gov-navy mb-3">Ready to skip the queue?</h2>
                    <p className="text-gray-500 mb-6">Register now and book your first token in under 2 minutes.</p>
                    <Link
                        to="/register"
                        className="bg-gov-navy hover:bg-gov-blue text-white font-bold px-10 py-3.5 rounded-xl transition-all duration-200 shadow-lg inline-block hover:scale-105"
                    >
                        Get Started – It's Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gov-navy text-blue-300 text-center py-6 text-sm">
                <p>© 2026 GovToken – Government of Tamil Nadu Digital Services. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
