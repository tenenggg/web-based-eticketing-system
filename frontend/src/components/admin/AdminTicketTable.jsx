// Imports
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../../utils/formatters.js';
import PriorityBadge from '../shared/PriorityBadge.jsx';
import StatusBadge from '../shared/StatusBadge.jsx';




// Format resolution time (minutes → h/m)
function formatTimeTaken(minutes) {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}




// Full-width dashboard table for admins
export default function AdminTicketTable({ tickets }) {
  const navigate = useNavigate();

  const handleRowClick = (ticketId) => {
    navigate(`/workspace/${ticketId}`);
  };

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Ticket ID</th>
          <th>Subject</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Type</th>
          <th>User</th>
          <th>Assigned Admin</th>
          <th>Last Activity</th>
          <th>Date Submitted</th>
          <th>Closed At</th>
          <th>Time Taken</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket) => {
          const activityTime = formatTimestamp(ticket.last_message_time || ticket.created_at);
          const submittedTime = formatTimestamp(ticket.created_at);
          const closedTime = ticket.closed_at ? formatTimestamp(ticket.closed_at) : '—';
          const timeTaken = formatTimeTaken(ticket.time_taken_minutes);
          const isClosed = ticket.status === 'Closed';
          const hasUnread = Number(ticket.unread_count) > 0;

          return (
            <tr
              key={ticket.id}
              className={`ticket-row ${isClosed ? 'is-closed' : ''}`}
              onClick={() => handleRowClick(ticket.id)}
            >
              <td className="t-id">
                {hasUnread && (
                  <span className="unread-dot" title={`${ticket.unread_count} unread`} />
                )}
                {ticket.ticket_number}
              </td>
              <td className="t-subject">
                <span>{ticket.subject}</span>
              </td>
              <td>
                <StatusBadge status={ticket.status} />
              </td>
              <td>
                <PriorityBadge priority={ticket.priority} />
              </td>
              <td>{ticket.category}</td>
              <td>{ticket.user_username || 'User'}</td>
              <td
                className={`t-assignee ${ticket.admin_username ? 't-assignee-assigned' : 't-assignee-unassigned'}`}
              >
                {ticket.admin_username || 'Unassigned'}
              </td>
              <td className="t-time">{activityTime}</td>
              <td className="t-time">{submittedTime}</td>
              <td className="t-time">{closedTime}</td>
              <td className="t-time-taken">
                {timeTaken ? (
                  <span className="time-taken-badge">{timeTaken}</span>
                ) : (
                  <span className="t-time">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
