import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * - allowedRoles: array of roles that can access this route
 * - If not logged in: redirect to /login
 * - If wrong role: redirect to their dashboard
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gov-light">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gov-navy font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) return <Navigate to="/login" replace />;

    const role = userProfile?.role || 'citizen';
    if (allowedRoles && !allowedRoles.includes(role)) {
        const redirect = (role === 'superadmin' || role === 'admin') ? '/admin-dashboard' : '/citizen-dashboard';
        return <Navigate to={redirect} replace />;
    }

    return children;
};

export default ProtectedRoute;
