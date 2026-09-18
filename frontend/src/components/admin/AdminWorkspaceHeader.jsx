// Imports
import { useNavigate } from 'react-router-dom';




// Workspace top bar for admins
export default function AdminWorkspaceHeader({ ticket }) {
  const navigate = useNavigate();

  return (
    <header className="workspace-topbar">
      <button type="button" className="btn-back" onClick={() => navigate('/dashboard')}>
        ← Back
      </button>
      <div className="topbar-context">
        <span className="ticket-id-badge">{ticket?.ticket_number || '—'}</span>
        <span className="ticket-subject-title">{ticket?.subject || 'Select a ticket'}</span>
      </div>
    </header>
  );
}
