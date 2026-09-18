// Imports
import AdminLayout from '../layouts/AdminLayout.jsx';
import UserLayout from '../layouts/UserLayout.jsx';
import AdminWorkspacePage from '../pages/admin/AdminWorkspacePage.jsx';
import UserWorkspacePage from '../pages/user/UserWorkspacePage.jsx';
import { useAuth } from '../hooks/useAuth.jsx';




// Picks admin vs user workspace + layout from session role
export default function RoleWorkspace() {
  const { isAdmin } = useAuth();                      // destructuring the useAuth hook to get the isAdmin function


  // if the user is an admin, render the AdminLayout component and the AdminWorkspacePage component
  if (isAdmin) {
    return (
      <AdminLayout>                {/* layout first before the workspace page */}
        <AdminWorkspacePage />
      </AdminLayout>
    );
  }

  // if the user is not an admin, render the UserLayout component and the UserWorkspacePage component
  return (
    <UserLayout>
      <UserWorkspacePage />
    </UserLayout>
  );
}
