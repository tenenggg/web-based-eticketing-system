// Imports
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../../utils/formatters.js';
import PriorityBadge from '../shared/PriorityBadge.jsx';
import StatusBadge from '../shared/StatusBadge.jsx';




// Compact card list for 320px user dashboard
export default function UserTicketCardList({ tickets }) {
  const navigate = useNavigate();

  return (
    <ul className="user-ticket-cards">
      {tickets.map((ticket) => {
        const hasUnread = Number(ticket.unread_count) > 0;
        const activityTime = formatTimestamp(ticket.last_message_time || ticket.created_at);

        return (
          <li key={ticket.id} className="user-ticket-card">
            <button
              type="button"
              className="user-ticket-card__main"
              onClick={() => navigate(`/workspace/${ticket.id}`)}
            >
              <div className="user-ticket-card__row">
                <span className="user-ticket-card__id">
                  {hasUnread && <span className="unread-dot" aria-hidden="true" />}
                  {ticket.ticket_number}
                </span>
                <span className="user-ticket-card__time">{activityTime}</span>
              </div>
              <p className="user-ticket-card__subject">{ticket.subject}</p>
              <div className="user-ticket-card__meta">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <p className="user-ticket-card__assignee">
                Admin: {ticket.admin_username || 'Unassigned'}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
