// Imports
import { useNavigate } from 'react-router-dom';




// Compact workspace header for portable user UI
export default function UserWorkspaceHeader({ ticket }) {
  const navigate = useNavigate();
  const adminName = ticket?.admin_username || 'Unassigned';

  return (
    <header className="workspace-topbar workspace-topbar--user">
      <div className="user-ws-header__row user-ws-header__row--top">
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate('/dashboard')}
          aria-label="Back to My Tickets"
          title="Back to My Tickets"
        >
          ←
        </button>
        <span className="ticket-id-badge user-ws-header__id">{ticket?.ticket_number || '—'}</span>
      </div>
      <div className="user-ws-header__row user-ws-header__row--title">
        <h2 className="user-ws-header__subject">{ticket?.subject || 'Select a ticket'}</h2>
        {ticket && (
          <p className="user-ws-header__admin">
            <span className="user-ws-header__admin-label">Admin :</span>{' '}
            <span className={`user-ws-header__admin-name ${adminName === 'Unassigned' ? 'is-unassigned' : ''}`}>
              {adminName}
            </span>
          </p>
        )}
      </div>
    </header>
  );
}
