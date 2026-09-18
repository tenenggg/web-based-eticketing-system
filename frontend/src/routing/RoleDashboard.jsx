// Imports
import AdminLayout from '../layouts/AdminLayout.jsx';
import UserLayout from '../layouts/UserLayout.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import UserDashboardPage from '../pages/user/UserDashboardPage.jsx';
import { useAuth } from '../hooks/useAuth.jsx';




// Picks admin vs user dashboard + layout from session role
export default function RoleDashboard() {
  const { isAdmin } = useAuth();                  // destructuring the useAuth hook to get the isAdmin function


  // if the user is an admin, render the admin dashboard page
  if (isAdmin) {
    return (
      <AdminLayout>                   {/* layout first before the dashboard page */}
        <AdminDashboardPage />
      </AdminLayout>
    );
  }

  // if the user is not an admin, render the user dashboard page
  return (
    <UserLayout>
      <UserDashboardPage />
    </UserLayout>
  );
}
