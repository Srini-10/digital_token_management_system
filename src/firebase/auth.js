import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

/**
 * Register a new user with email and password.
 */
export const registerWithEmail = async (email, password, displayName) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    return credential.user;
};

/**
 * Sign in an existing user.
 */
export const loginWithEmail = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
};

/**
 * Sign out the current user.
 */
export const logout = async () => {
    await signOut(auth);
};

/**
 * Get the currently authenticated user (null if not logged in).
 */
export const getCurrentUser = () => auth.currentUser;
