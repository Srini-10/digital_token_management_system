import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { getUserProfile } from '../firebase/firestore';

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const profile = await getUserProfile(user.uid);
                    // If Firestore has the user doc, use it
                    if (profile) {
                        setUserProfile(profile);
                    } else {
                        // No Firestore doc yet — fall back to Auth metadata
                        setUserProfile({
                            id: user.uid,
                            name: user.displayName || user.email?.split('@')[0] || 'User',
                            email: user.email,
                            role: 'citizen',
                        });
                    }
                } catch (err) {
                    // Firestore permission denied or offline — fall back gracefully
                    console.warn('Could not load Firestore profile, using Auth fallback:', err.code);
                    setUserProfile({
                        id: user.uid,
                        name: user.displayName || user.email?.split('@')[0] || 'User',
                        email: user.email,
                        // Default to citizen; update Firestore rules to load real role
                        role: 'citizen',
                    });
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const refreshProfile = async () => {
        if (currentUser) {
            try {
                const profile = await getUserProfile(currentUser.uid);
                if (profile) setUserProfile(profile);
            } catch (err) {
                console.warn('Could not refresh profile:', err.code);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ currentUser, userProfile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
