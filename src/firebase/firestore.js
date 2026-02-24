import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    onSnapshot,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

/** Create a user profile in Firestore after registration */
export const createUserProfile = async (uid, data) => {
    await setDoc(doc(db, 'users', uid), {
        ...data,
        role: data.role || 'citizen',
        createdAt: serverTimestamp(),
    });
};

/** Fetch a user profile by UID */
export const getUserProfile = async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Update a user profile */
export const updateUserProfile = async (uid, data) => {
    await updateDoc(doc(db, 'users', uid), data);
};

/** Get all admin users (for superadmin) */
export const getAllAdmins = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/** Get all users */
export const getAllUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─────────────────────────────────────────────
// DEPARTMENTS
// ─────────────────────────────────────────────

export const getDepartments = async (activeOnly = true) => {
    let q = collection(db, 'departments');
    if (activeOnly) {
        q = query(q, where('isActive', '==', true));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addDepartment = async (data) => {
    return addDoc(collection(db, 'departments'), { ...data, isActive: true, createdAt: serverTimestamp() });
};

export const updateDepartment = async (id, data) => {
    await updateDoc(doc(db, 'departments', id), data);
};

export const deleteDepartment = async (id) => {
    await deleteDoc(doc(db, 'departments', id));
};

// ─────────────────────────────────────────────
// SLOTS
// ─────────────────────────────────────────────

export const getSlotsForDepartmentDate = async (departmentId, date) => {
    const q = query(
        collection(db, 'slots'),
        where('department_id', '==', departmentId),
        where('date', '==', date)
    );
    const snap = await getDocs(q);
    // Sort client-side — avoids needing a composite index
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.slot_time > b.slot_time ? 1 : -1));
};

export const addSlot = async (data) => {
    return addDoc(collection(db, 'slots'), {
        ...data,
        booked_count: 0,
        isBlocked: false,
        createdAt: serverTimestamp(),
    });
};

export const updateSlot = async (id, data) => {
    await updateDoc(doc(db, 'slots', id), data);
};

export const deleteSlot = async (id) => {
    await deleteDoc(doc(db, 'slots', id));
};

// ─────────────────────────────────────────────
// HOLIDAYS
// ─────────────────────────────────────────────

export const getHolidays = async () => {
    const snap = await getDocs(collection(db, 'holidays'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addHoliday = async (date, reason) => {
    return addDoc(collection(db, 'holidays'), { date, reason, createdAt: serverTimestamp() });
};

export const deleteHoliday = async (id) => {
    await deleteDoc(doc(db, 'holidays', id));
};

// ─────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────

/**
 * Book a token using a Firestore transaction.
 * Generates token number: DEPT-YEAR-NNN
 * Increments slot booked_count atomically.
 */
export const bookToken = async ({ userId, departmentId, slotId, departmentCode, userName, departmentName, slotTime, date }) => {
    const slotRef = doc(db, 'slots', slotId);
    const year = new Date().getFullYear();

    // Get today's token count for this department
    const todayQ = query(
        collection(db, 'tokens'),
        where('department_id', '==', departmentId),
        where('booking_date', '==', date)
    );

    return runTransaction(db, async (transaction) => {
        const slotSnap = await transaction.get(slotRef);
        if (!slotSnap.exists()) throw new Error('Slot not found.');

        const slotData = slotSnap.data();
        if (slotData.isBlocked) throw new Error('This slot is blocked.');
        if (slotData.booked_count >= slotData.max_tokens) throw new Error('Slot is fully booked.');

        // Count existing tokens for department+date to generate serial number
        const existingSnap = await getDocs(todayQ);
        const serialNumber = String(existingSnap.size + 1).padStart(3, '0');
        const tokenNumber = `${departmentCode.toUpperCase()}-${year}-${serialNumber}`;

        const tokenRef = doc(collection(db, 'tokens'));
        const qrData = JSON.stringify({ tokenId: tokenRef.id, tokenNumber, userId, departmentId });

        transaction.set(tokenRef, {
            user_id: userId,
            user_name: userName,
            department_id: departmentId,
            department_name: departmentName,
            slot_id: slotId,
            slot_time: slotTime,
            token_number: tokenNumber,
            booking_date: date,
            status: 'pending',
            qr_data: qrData,
            createdAt: serverTimestamp(),
        });

        const newCount = slotData.booked_count + 1;
        transaction.update(slotRef, {
            booked_count: newCount,
            isBlocked: newCount >= slotData.max_tokens,
        });

        return { tokenId: tokenRef.id, tokenNumber, qrData };
    });
};

/** Get all tokens for a user */
export const getUserTokens = async (userId) => {
    const q = query(
        collection(db, 'tokens'),
        where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        // Sort newest first client-side — avoids composite index requirement
        .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
        });
};

/** Real-time listener for today's tokens (admin) */
export const subscribeToTodayTokens = (date, departmentId, callback) => {
    // Build query without orderBy to avoid composite index requirement
    let constraints = [where('booking_date', '==', date)];
    if (departmentId) constraints.push(where('department_id', '==', departmentId));
    const q = query(collection(db, 'tokens'), ...constraints);
    return onSnapshot(q, (snap) => {
        const tokens = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() ?? 0;
                const tb = b.createdAt?.toMillis?.() ?? 0;
                return ta - tb;
            });
        callback(tokens);
    });
};

/** Real-time listener for live token screen */
export const subscribeToCalledToken = (departmentId, callback) => {
    const q = query(
        collection(db, 'tokens'),
        where('department_id', '==', departmentId),
        where('status', '==', 'called')
    );
    return onSnapshot(q, (snap) => {
        const tokens = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            // Most recently updated first — sort by updatedAt client-side
            .sort((a, b) => {
                const ta = a.updatedAt?.toMillis?.() ?? 0;
                const tb = b.updatedAt?.toMillis?.() ?? 0;
                return tb - ta;
            });
        callback(tokens[0] || null);
    });
};

/** Update token status */
export const updateTokenStatus = async (tokenId, status) => {
    await updateDoc(doc(db, 'tokens', tokenId), {
        status,
        updatedAt: serverTimestamp(),
    });
};

/** Cancel a token and decrement slot count */
export const cancelToken = async (tokenId, slotId) => {
    const tokenRef = doc(db, 'tokens', tokenId);
    const slotRef = doc(db, 'slots', slotId);
    return runTransaction(db, async (transaction) => {
        const tokenSnap = await transaction.get(tokenRef);
        if (!tokenSnap.exists()) throw new Error('Token not found.');
        if (tokenSnap.data().status !== 'pending') throw new Error('Only pending tokens can be cancelled.');

        const slotSnap = await transaction.get(slotRef);
        transaction.update(tokenRef, { status: 'cancelled', updatedAt: serverTimestamp() });
        if (slotSnap.exists()) {
            const newCount = Math.max(0, (slotSnap.data().booked_count || 1) - 1);
            transaction.update(slotRef, { booked_count: newCount, isBlocked: false });
        }
    });
};

/** Get all tokens for analytics */
export const getTokensByDateRange = async (startDate, endDate) => {
    // Use only range filters — no orderBy to avoid composite index
    const q = query(
        collection(db, 'tokens'),
        where('booking_date', '>=', startDate),
        where('booking_date', '<=', endDate)
    );
    const snap = await getDocs(q);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.booking_date > b.booking_date ? 1 : -1));
};

/** Get tokens for a specific department and date */
export const getTokensByDepartmentDate = async (departmentId, date) => {
    const q = query(
        collection(db, 'tokens'),
        where('department_id', '==', departmentId),
        where('booking_date', '==', date)
    );
    const snap = await getDocs(q);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return ta - tb;
        });
};
