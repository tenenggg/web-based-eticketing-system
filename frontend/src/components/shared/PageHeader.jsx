// Imports
import { useAuth } from '../../hooks/useAuth.jsx';




// Role label for identity pill
function formatRoleLabel(role) {
  if (role === 'admin') return 'Admin';
  if (role === 'user') return 'User';
  return role || '';
}




// Top bar with title, optional back/action button, identity, logout
export default function PageHeader({ pageTitle, actionButton = null, backButton = null, compact = false }) {
  const { currentUser, handleLogout } = useAuth();
  const roleLabel = formatRoleLabel(currentUser?.role);

  return (
    <header className={`page-header ${compact ? 'page-header--compact' : ''}`}>
      <div className="header-left">
        <div className="header-title-group">
          {backButton && <div className="header-back-wrap">{backButton}</div>}
          <h1>{pageTitle}</h1>
        </div>
      </div>
      <div className="header-right">
        {actionButton}
        <div className="user-identity">
          <span className="identity-pill">
            <span className="identity-role">{roleLabel} :</span>
            <span className="identity-name">{currentUser?.username}</span>
          </span>
          <button type="button" onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
