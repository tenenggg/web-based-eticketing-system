// Imports
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';




// Route guard — redirects unauthenticated users to login
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();                                // destructuring the useAuth hook to get the isAuthenticated function

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;                            // if not authenticated, redirect to the login page
  }

  return children;                                                      // if authenticated, render the children component, which is the dashboard or workspace component
}
