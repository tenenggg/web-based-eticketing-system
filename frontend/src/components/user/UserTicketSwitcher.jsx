// Imports
import StatusBadge from '../shared/StatusBadge.jsx';




// Dropdown to switch tickets in the portable workspace
export default function UserTicketSwitcher({ tickets, activeTicketId, onSelectTicket }) {
  if (tickets.length === 0) {
    return <p className="user-ticket-switcher__empty">No tickets yet</p>;
  }

  return (
    <div className="user-ticket-switcher">
      <label htmlFor="user-ticket-select" className="user-ticket-switcher__label">
        My tickets
      </label>
      <select
        id="user-ticket-select"
        className="user-ticket-switcher__select"
        value={activeTicketId ?? ''}
        onChange={(event) => onSelectTicket(event.target.value)}
      >
        {tickets.map((ticket) => (
          <option key={ticket.id} value={ticket.id}>
            {ticket.ticket_number} — {ticket.subject.slice(0, 40)}
            {ticket.subject.length > 40 ? '…' : ''}
          </option>
        ))}
      </select>
      {activeTicketId && (
        <div className="user-ticket-switcher__status">
          <StatusBadge
            status={tickets.find((t) => Number(t.id) === Number(activeTicketId))?.status}
          />
        </div>
      )}
    </div>
  );
}
