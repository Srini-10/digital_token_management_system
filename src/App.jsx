import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { autoSeedIfEmpty } from './firebase/seedData';
import SetupPage from './pages/SetupPage';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import BookToken from './pages/BookToken';
import TokenHistory from './pages/TokenHistory';
import AdminDashboard from './pages/AdminDashboard';
import LiveTokenScreen from './pages/LiveTokenScreen';

function App() {
    useEffect(() => {
        // Auto-seed demo departments and slots if Firestore is empty (first run)
        autoSeedIfEmpty();
    }, []);

    return (
        <div className="min-h-screen bg-gov-light">
            <Navbar />
            <Routes>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/live" element={<LiveTokenScreen />} />
                <Route path="/setup" element={<SetupPage />} />
                {/* Citizen */}
                <Route path="/citizen-dashboard" element={
                    <ProtectedRoute allowedRoles={['citizen']}>
                        <CitizenDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/book-token" element={
                    <ProtectedRoute allowedRoles={['citizen']}>
                        <BookToken />
                    </ProtectedRoute>
                } />
                <Route path="/token-history" element={
                    <ProtectedRoute allowedRoles={['citizen']}>
                        <TokenHistory />
                    </ProtectedRoute>
                } />

                {/* Admin — unified dashboard for admin + superadmin */}
                <Route path="/admin-dashboard" element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default App;
