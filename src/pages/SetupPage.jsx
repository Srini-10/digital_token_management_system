import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, setDoc, doc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';

const DEPARTMENTS = [
    {
        department_name: 'RTO Office',
        office_location: 'Regional Transport Office, Anna Salai, Chennai',
        subdivisions: [
            'New Vehicle Registration',
            'Driving Licence (Fresh)',
            'Driving Licence Renewal',
            'RC Transfer / Ownership Change',
            'NOC (No Objection Certificate)',
            'Pollution Certificate (PUC)',
            'Hypothecation Addition / Removal',
        ],
    },
    {
        department_name: 'Revenue Office',
        office_location: 'District Collectorate, Rajaji Salai, Chennai',
        subdivisions: [
            'Patta / Chitta (Land Records)',
            'Birth Certificate',
            'Death Certificate',
            'Income Certificate',
            'Community Certificate',
            'Nativity Certificate',
            'Legal Heir Certificate',
        ],
    },
    {
        department_name: 'Municipal Corporation',
        office_location: 'Ripon Building, Park Town, Chennai',
        subdivisions: [
            'Property Tax Payment',
            'Trade Licence',
            'Building Plan Approval',
            'Water & Sewerage Connection',
            'Birth / Death Certificate',
            'Encumbrance Certificate',
        ],
    },
    {
        department_name: 'Passport Seva Kendra',
        office_location: 'PSK Chennai, Kathipara Junction, Guindy',
        subdivisions: [
            'Fresh Passport Application',
            'Tatkal Passport',
            'Passport Renewal',
            'Police Clearance Certificate (PCC)',
            'Passport for Minor',
        ],
    },
    {
        department_name: 'Aadhaar Centre (UIDAI)',
        office_location: 'UIDAI Office, Haddows Road, Nungambakkam',
        subdivisions: [
            'New Aadhaar Enrolment',
            'Address Update',
            'Mobile Number Update',
            'Biometric Update',
            'Name / DOB Correction',
            'Aadhaar Card Reprint',
        ],
    },
    {
        department_name: 'Employment Office',
        office_location: 'District Employment Office, Egmore, Chennai',
        subdivisions: [
            'New Job Registration',
            'Registration Renewal',
            'Employment Certificate',
            'Job Fair Participation',
            'Skill Development Enquiry',
        ],
    },
    {
        department_name: 'Ration Shop (PDS)',
        office_location: 'Taluk Supply Office, Purasaiwakkam, Chennai',
        subdivisions: [
            'New Ration Card Application',
            'Card Correction / Update',
            'Member Addition / Removal',
            'Surrender of Ration Card',
            'Duplicate Card Request',
            'Category Change (BPL / APL / AAY)',
        ],
    },
];

const SLOT_TIMES = [
    '09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM', '11:00 AM - 11:30 AM', '11:30 AM - 12:00 PM',
    '02:00 PM - 02:30 PM', '02:30 PM - 03:00 PM', '03:00 PM - 03:30 PM',
];

const getNext7Weekdays = () => {
    const dates = [];
    const d = new Date();
    while (dates.length < 7) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${dd}`);
        }
        d.setDate(d.getDate() + 1);
    }
    return dates;
};

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASS = '123456';

const SetupPage = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);

    const addLog = (msg, type = 'info') =>
        setLogs(prev => [...prev, { msg, type, id: Date.now() + Math.random() }]);

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const runSetup = async () => {
        setRunning(true);
        setLogs([]);

        try {
            // ── Step 1: Create admin account ─────────────────────────────────
            addLog('Creating admin account (admin@gmail.com)...', 'info');
            let adminUid;
            try {
                const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
                adminUid = cred.user.uid;
                addLog(`✅ Admin account created  (uid: ${adminUid.slice(0, 8)}...)`, 'success');
            } catch (err) {
                if (err.code === 'auth/email-already-in-use') {
                    // Sign in to get UID
                    const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
                    adminUid = cred.user.uid;
                    addLog(`ℹ️ Admin account already exists — signed in OK`, 'info');
                } else {
                    throw new Error(`Admin auth failed: ${err.message}`);
                }
            }

            // ── Step 2: Save admin profile in Firestore ───────────────────────
            addLog('Saving admin profile to Firestore...', 'info');
            await setDoc(doc(db, 'users', adminUid), {
                name: 'Admin User', email: ADMIN_EMAIL, mobile: '9999999999',
                role: 'superadmin', createdAt: serverTimestamp(),
            });
            addLog('✅ Admin profile saved (role: superadmin — full access)', 'success');

            // ── Step 3: Create departments ────────────────────────────────────
            addLog('Creating departments...', 'info');
            const deptIds = [];
            for (const dept of DEPARTMENTS) {
                const ref = await addDoc(collection(db, 'departments'), {
                    department_name: dept.department_name,
                    office_location: dept.office_location,
                    isActive: true,
                    createdAt: serverTimestamp(),
                });
                deptIds.push({ id: ref.id, ...dept });
                addLog(`✅ ${dept.department_name}`, 'success');
                await sleep(100);
            }

            // ── Step 4: Create slots for next 7 weekdays ──────────────────────
            const dates = getNext7Weekdays();
            let slotCount = 0;
            addLog(`Creating slots for ${dates.length} days × ${deptIds.length} depts × ${SLOT_TIMES.length} slots...`, 'info');

            for (const date of dates) {
                for (const dept of deptIds) {
                    for (const slot_time of SLOT_TIMES) {
                        await addDoc(collection(db, 'slots'), {
                            department_id: dept.id,
                            date,
                            slot_time,
                            max_tokens: 10,
                            booked_count: 0,
                            isBlocked: false,
                            createdAt: serverTimestamp(),
                        });
                        slotCount++;
                    }
                }
                addLog(`✅ Slots created for ${date}`, 'success');
                await sleep(50);
            }

            // ── Step 5: Create a demo superadmin profile for current user ─────
            addLog('Creating superadmin profile for first user...', 'info');
            try {
                const superCred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
                // Check if there's a different user registered as superadmin
                const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'superadmin')));
                if (usersSnap.empty) {
                    // Make admin also superadmin for now
                    await setDoc(doc(db, 'users', superCred.user.uid), {
                        name: 'Super Admin', email: ADMIN_EMAIL, mobile: '9999999999',
                        role: 'superadmin', createdAt: serverTimestamp(),
                    });
                    addLog('✅ Admin promoted to superadmin (no other superadmin found)', 'info');
                } else {
                    addLog('ℹ️ Superadmin already exists — keeping admin role for admin@gmail.com', 'info');
                }
            } catch { /* ignore */ }

            addLog('', 'divider');
            addLog(`🎉 Setup complete! ${deptIds.length} departments + ${slotCount} slots created.`, 'success');
            addLog('', 'divider');
            addLog('Login credentials:', 'bold');
            addLog('  👑 Super Admin: (your first registered account)', 'info');
            addLog('  🔑 Admin: admin@gmail.com  /  123456', 'info');
            addLog('  👤 Citizen: register a new account at /register', 'info');

            setDone(true);
        } catch (err) {
            addLog(`❌ Error: ${err.message}`, 'error');
            addLog('→ Check that your Firestore rules allow authenticated writes.', 'warn');
            addLog('→ In Firebase Console → Firestore → Rules, temporarily set:', 'warn');
            addLog('    allow read, write: if true;', 'code');
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gov-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">⚙️</span>
                </div>
                <h1 className="text-2xl font-bold text-gov-navy">One-Click Setup</h1>
                <p className="text-gray-500 text-sm mt-1">Creates demo data + admin account for testing</p>
            </div>

            {/* What this does */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 text-sm text-blue-800">
                <p className="font-semibold mb-2">This setup will:</p>
                <ul className="space-y-1 text-blue-700">
                    <li>✅ Create <strong>admin@gmail.com</strong> (password: <strong>123456</strong>)</li>
                    <li>✅ Add <strong>6 Tamil Nadu government departments</strong></li>
                    <li>✅ Create <strong>9 time slots/day × 7 weekdays</strong> for all departments</li>
                    <li>✅ Set up all roles (superadmin / admin / citizen)</li>
                </ul>
            </div>

            {/* Run button */}
            {!done && (
                <button
                    onClick={runSetup}
                    disabled={running}
                    className="w-full bg-gov-navy hover:bg-gov-blue disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-lg transition-all flex items-center justify-center gap-3 mb-6"
                >
                    {running ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Setting up...</>
                    ) : '🚀 Run Setup Now'}
                </button>
            )}

            {done && (
                <div className="flex gap-3 mb-6">
                    <button onClick={() => navigate('/login')} className="flex-1 bg-gov-navy hover:bg-gov-blue text-white font-bold py-3 rounded-xl transition-colors">
                        Go to Login →
                    </button>
                    <button onClick={() => navigate('/')} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors">
                        Home
                    </button>
                </div>
            )}

            {/* Log output */}
            {logs.length > 0 && (
                <div className="bg-gray-900 rounded-2xl p-5 font-mono text-xs max-h-96 overflow-y-auto">
                    {logs.map(log => (
                        <div key={log.id} className={
                            log.type === 'success' ? 'text-green-400 py-0.5' :
                                log.type === 'error' ? 'text-red-400 py-0.5' :
                                    log.type === 'warn' ? 'text-yellow-400 py-0.5' :
                                        log.type === 'code' ? 'text-cyan-300 py-0.5 pl-4' :
                                            log.type === 'bold' ? 'text-white font-bold py-1 mt-1' :
                                                log.type === 'divider' ? 'border-t border-gray-700 my-2' :
                                                    'text-gray-300 py-0.5'
                        }>
                            {log.msg}
                        </div>
                    ))}
                    {running && (
                        <div className="text-yellow-300 animate-pulse">⏳ Working...</div>
                    )}
                </div>
            )}

            {/* Credentials card */}
            {done && (
                <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h2 className="font-bold text-gov-navy mb-3">🔑 Login Credentials</h2>
                    <div className="space-y-2">
                        {[
                            { role: 'Admin', email: 'admin@gmail.com', pass: '123456', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                            { role: 'Citizen', email: 'Register at /register', pass: 'your choice', color: 'bg-green-50 border-green-200 text-green-800' },
                        ].map(c => (
                            <div key={c.role} className={`border rounded-xl px-4 py-3 ${c.color}`}>
                                <p className="font-semibold text-sm">{c.role}</p>
                                <p className="text-xs mt-0.5">Email: <span className="font-mono">{c.email}</span></p>
                                <p className="text-xs">Pass: <span className="font-mono">{c.pass}</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SetupPage;
