// Imports
import { formatTimestamp } from '../../utils/formatters.js';




// Original request block above the user thread
export default function UserTicketRequestHeader({ ticket }) {
  if (!ticket) return null;

  return (
    <header className="user-request-header">
      <h2 className="user-request-header__subject">{ticket.subject}</h2>
      <p className="user-request-header__meta">
        {ticket.ticket_number} · {formatTimestamp(ticket.created_at)}
      </p>
      {ticket.description && (
        <div className="user-request-header__description">
          <p className="user-request-header__label">Your request</p>
          <p>{ticket.description}</p>
        </div>
      )}
    </header>
  );
}
