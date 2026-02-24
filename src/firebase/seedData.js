import { collection, getDocs, addDoc, setDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { format, addDays } from 'date-fns';

const DEMO_DEPARTMENTS = [
    { department_name: 'RTO Office', office_location: 'Regional Transport Office, Anna Salai, Chennai' },
    { department_name: 'Revenue Office', office_location: 'District Collectorate, Rajaji Salai, Chennai' },
    { department_name: 'Municipal Office', office_location: 'Ripon Building, Park Town, Chennai' },
    { department_name: 'Passport Seva', office_location: 'PSK Chennai, Kathipara Junction, Guindy' },
    { department_name: 'Aadhaar Centre', office_location: 'UIDAI Office, Haddows Road, Nungambakkam' },
    { department_name: 'Employment Office', office_location: 'District Employment Office, Egmore, Chennai' },
];

const SLOT_TIMES = [
    '09:00 AM – 09:30 AM',
    '09:30 AM – 10:00 AM',
    '10:00 AM – 10:30 AM',
    '10:30 AM – 11:00 AM',
    '11:00 AM – 11:30 AM',
    '11:30 AM – 12:00 PM',
    '02:00 PM – 02:30 PM',
    '02:30 PM – 03:00 PM',
    '03:00 PM – 03:30 PM',
];

/**
 * Checks if departments exist. If not, seeds demo departments + slots.
 * Safe to call on every app load — does nothing if data already exists.
 */
export const autoSeedIfEmpty = async () => {
    try {
        const deptSnap = await getDocs(collection(db, 'departments'));
        if (!deptSnap.empty) return; // Already seeded

        console.log('[Seed] No departments found — seeding demo data...');

        // Create departments
        const deptIds = [];
        for (const dept of DEMO_DEPARTMENTS) {
            const ref = await addDoc(collection(db, 'departments'), {
                ...dept,
                isActive: true,
                createdAt: serverTimestamp(),
            });
            deptIds.push(ref.id);
        }

        // Create slots for the next 7 weekdays for each department
        const today = new Date();
        let slotsCreated = 0;
        for (let dayOffset = 0; dayOffset < 14 && slotsCreated < 7; dayOffset++) {
            const d = addDays(today, dayOffset);
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
            const dateStr = format(d, 'yyyy-MM-dd');

            for (const deptId of deptIds) {
                for (const slotTime of SLOT_TIMES) {
                    await addDoc(collection(db, 'slots'), {
                        department_id: deptId,
                        date: dateStr,
                        slot_time: slotTime,
                        max_tokens: 10,
                        booked_count: 0,
                        isBlocked: false,
                        createdAt: serverTimestamp(),
                    });
                }
            }
            slotsCreated++;
        }

        console.log(`[Seed] Created ${DEMO_DEPARTMENTS.length} departments and slots for ${slotsCreated} days.`);
    } catch (err) {
        // Silently ignore seeding errors (e.g. Firestore rules not yet set)
        console.warn('[Seed] Could not auto-seed demo data:', err.code);
    }
};

/**
 * Checks if any users exist in Firestore.
 * Returns true if this is the very first user registration.
 */
export const isFirstUser = async () => {
    try {
        const snap = await getDocs(collection(db, 'users'));
        return snap.empty;
    } catch {
        return false;
    }
};

/**
 * Force-seeds demo departments + slots regardless of existing data.
 * Used by SuperAdmin "Reload Demo Data" button.
 */
export const forceSeedDemo = async () => {
    console.log('[Seed] Force-seeding demo data...');
    const deptIds = [];
    for (const dept of DEMO_DEPARTMENTS) {
        const ref = await addDoc(collection(db, 'departments'), {
            ...dept, isActive: true, createdAt: serverTimestamp(),
        });
        deptIds.push(ref.id);
    }

    const today = new Date();
    let days = 0;
    for (let i = 0; i < 14 && days < 7; i++) {
        const d = addDays(today, i);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        const dateStr = format(d, 'yyyy-MM-dd');
        for (const deptId of deptIds) {
            for (const slotTime of SLOT_TIMES) {
                await addDoc(collection(db, 'slots'), {
                    department_id: deptId, date: dateStr, slot_time: slotTime,
                    max_tokens: 10, booked_count: 0, isBlocked: false, createdAt: serverTimestamp(),
                });
            }
        }
        days++;
    }
    return { departments: DEMO_DEPARTMENTS.length, days };
};

