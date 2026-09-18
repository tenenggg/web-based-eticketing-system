// Imports
import { formatTimestamp } from '../../utils/formatters.js';
import Pagination from '../shared/Pagination.jsx';
import StatusBadge from '../shared/StatusBadge.jsx';




// Left panel ticket list in admin workspace
export default function TicketSidebar({
  tickets,
  allTicketsCount,
  activeTicketId,
  sidebarCurrentPage,
  sidebarTotalPages,
  sidebarSearchTerm,
  sidebarSortOrder,
  sidebarFilterPriority,
  sidebarFilterType,
  onSearchChange,
  onSortChange,
  onFilterPriorityChange,
  onFilterTypeChange,
  onTicketClick,
  onPreviousPage,
  onNextPage,
}) {
  return (
    <aside className="workspace-left">
      <div className="sidebar-header sidebar-header-filters">
        <div className="sidebar-filter-row">                              {/* sort + priority + type */}
          <select
            className="sidebar-select"
            value={sidebarSortOrder}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label="Sort tickets"
          >
            <option value="activity">All</option>
            <option value="newest">Newest</option>
          </select>
          <select
            className="sidebar-select"
            value={sidebarFilterPriority}
            onChange={(event) => onFilterPriorityChange(event.target.value)}
            aria-label="Filter by priority"
          >
            <option value="">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          <select
            className="sidebar-select"
            value={sidebarFilterType}
            onChange={(event) => onFilterTypeChange(event.target.value)}
            aria-label="Filter by type"
          >
            <option value="">All</option>
            <option value="General">General</option>
            <option value="Technical">Technical</option>
            <option value="Billing">Billing</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          value={sidebarSearchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="search ticket's subject"
        />
      </div>

      <ul className="compact-ticket-list">
        {tickets.length === 0 ? (
          <li className="sidebar-empty">No tickets found</li>
        ) : (
          tickets.map((ticket) => {
            const isActive = Number(ticket.id) === Number(activeTicketId);
            const timeString = formatTimestamp(ticket.last_message_time || ticket.created_at);

            return (
              <li
                key={ticket.id}
                className={`sidebar-item ${isActive ? 'active' : ''} ${ticket.unread_count > 0 ? 'unread' : ''}`}
                onClick={() => onTicketClick(ticket.id)}
              >
                <div className="si-top">
                  <span className="si-id">
                    {ticket.unread_count > 0 && (
                      <span className="unread-dot" title={`${ticket.unread_count} unread`} />
                    )}
                    {ticket.ticket_number}
                  </span>
                  <span className="si-time">{timeString}</span>
                </div>
                <div className="si-subject">{ticket.subject}</div>
                <div className="si-bottom">
                  <StatusBadge status={ticket.status} />
                </div>
              </li>
            );
          })
        )}
      </ul>

      {allTicketsCount > 0 && (
        <Pagination
          variant="sidebar"
          currentPage={sidebarCurrentPage}
          totalPages={sidebarTotalPages}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
      )}
    </aside>
  );
}
