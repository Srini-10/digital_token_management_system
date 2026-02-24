#!/usr/bin/env node
/**
 * seed-firestore.mjs
 * ------------------
 * Adds 6 demo Tamil Nadu government departments + time slots to Firestore.
 *
 * Usage:
 *   node scripts/seed-firestore.mjs <API_KEY> <PROJECT_ID>
 *
 * Example:
 *   node scripts/seed-firestore.mjs AIzaSy... digital-token-management
 *
 * Both values are in your .env file:
 *   VITE_FIREBASE_API_KEY    → API_KEY
 *   VITE_FIREBASE_PROJECT_ID → PROJECT_ID
 */

import { createInterface } from 'readline';

const [, , API_KEY, PROJECT_ID] = process.argv;

if (!API_KEY || !PROJECT_ID) {
    console.error('\nUsage: node scripts/seed-firestore.mjs <API_KEY> <PROJECT_ID>');
    console.error('\nOpen your .env file and pass:');
    console.error('  VITE_FIREBASE_API_KEY    as API_KEY');
    console.error('  VITE_FIREBASE_PROJECT_ID as PROJECT_ID\n');
    process.exit(1);
}

const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;

// ─── Demo data ──────────────────────────────────────────────────────────────
const DEPARTMENTS = [
    { department_name: 'RTO Office', office_location: 'Regional Transport Office, Anna Salai, Chennai' },
    { department_name: 'Revenue Office', office_location: 'District Collectorate, Rajaji Salai, Chennai' },
    { department_name: 'Municipal Office', office_location: 'Ripon Building, Park Town, Chennai' },
    { department_name: 'Passport Seva', office_location: 'PSK Chennai, Kathipara Junction, Guindy' },
    { department_name: 'Aadhaar Centre', office_location: 'UIDAI Office, Haddows Road, Nungambakkam' },
    { department_name: 'Employment Office', office_location: 'District Employment Office, Egmore, Chennai' },
];

const SLOT_TIMES = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '02:00 PM - 02:30 PM',
    '02:30 PM - 03:00 PM',
    '03:00 PM - 03:30 PM',
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const prompt = (question) => new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); });
});

const strVal = (v) => ({ stringValue: String(v) });
const intVal = (v) => ({ integerValue: String(v) });
const boolVal = (v) => ({ booleanValue: Boolean(v) });

const fsPost = async (collection, fields, idToken) => {
    const res = await fetch(`${FS_BASE}/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ fields }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || JSON.stringify(json.error));
    return json;
};

const fsPatch = async (path, fields, idToken) => {
    const res = await fetch(`${FS_BASE}/${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ fields }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || JSON.stringify(json.error));
    return json;
};

const getNextWeekdays = (count = 7) => {
    const dates = [];
    const d = new Date();
    while (dates.length < count) {
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

// ─── Main ───────────────────────────────────────────────────────────────────
console.log('\n🏛  GovToken — Firestore Seed Script');
console.log(`   Project: ${PROJECT_ID}\n`);
console.log('Sign in with your superadmin Firebase account:\n');

const email = await prompt('  Email:    ');
const password = await prompt('  Password: ');

// 1. Authenticate
process.stdout.write('\n🔐  Signing in to Firebase...');
let idToken, uid;
try {
    const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Auth failed');
    idToken = json.idToken;
    uid = json.localId;
    console.log(' ✅  OK\n');
} catch (err) {
    console.error('\n❌  Sign-in failed:', err.message);
    console.error('   Check that Email/Password auth is enabled in Firebase Console → Authentication.\n');
    process.exit(1);
}

// 2. Ensure superadmin profile exists in Firestore
process.stdout.write('👤  Updating superadmin Firestore profile...');
try {
    await fsPatch(`users/${uid}`, {
        name: strVal(email.split('@')[0]),
        email: strVal(email),
        role: strVal('superadmin'),
        mobile: strVal('0000000000'),
    }, idToken);
    console.log(' ✅\n');
} catch (err) {
    console.warn(` ⚠️  Skipped (${err.message}) — continuing anyway\n`);
}

// 3. Add departments
console.log('🏢  Creating departments...');
const deptIds = [];
for (const dept of DEPARTMENTS) {
    try {
        const doc = await fsPost('departments', {
            department_name: strVal(dept.department_name),
            office_location: strVal(dept.office_location),
            isActive: boolVal(true),
        }, idToken);
        const id = doc.name.split('/').pop();
        deptIds.push(id);
        console.log(`   ✅  ${dept.department_name}`);
    } catch (err) {
        console.error(`   ❌  ${dept.department_name}: ${err.message}`);
    }
}

if (deptIds.length === 0) {
    console.error('\n❌  No departments created. Likely a Firestore rules issue.');
    console.error('   Fix: In Firebase Console → Firestore → Rules, set:\n');
    console.error('     allow read, write: if true;\n');
    console.error('   Then run this script again.\n');
    process.exit(1);
}

// 4. Add slots for next 7 weekdays
const dates = getNextWeekdays(7);
console.log(`\n🕐  Creating slots  (${deptIds.length} depts × ${dates.length} days × ${SLOT_TIMES.length} slots)...`);
let slotCount = 0;

for (const date of dates) {
    for (const deptId of deptIds) {
        for (const slot_time of SLOT_TIMES) {
            try {
                await fsPost('slots', {
                    department_id: strVal(deptId),
                    date: strVal(date),
                    slot_time: strVal(slot_time),
                    max_tokens: intVal(10),
                    booked_count: intVal(0),
                    isBlocked: boolVal(false),
                }, idToken);
                slotCount++;
            } catch (err) {
                process.stdout.write('!');
            }
        }
    }
    process.stdout.write(`   📅  ${date}\n`);
}

console.log(`\n🎉  Seeding complete!`);
console.log(`   🏢  ${deptIds.length} / ${DEPARTMENTS.length} departments created`);
console.log(`   🕐  ${slotCount} slots created\n`);
console.log('Refresh your app — departments and slots will now appear.\n');
