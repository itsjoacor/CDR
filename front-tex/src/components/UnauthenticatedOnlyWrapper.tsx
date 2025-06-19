import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const UnauthenticatedOnlyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};