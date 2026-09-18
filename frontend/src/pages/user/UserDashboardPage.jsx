// Imports
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader.jsx';
import Pagination from '../../components/shared/Pagination.jsx';
import CreateTicketModal from '../../components/user/CreateTicketModal.jsx';
import UserTicketCardList from '../../components/user/UserTicketCardList.jsx';
import { useRealtimeTicketList } from '../../hooks/shared/useRealtimeTicketList.js';
import { useUserDashboard } from '../../hooks/user/useUserDashboard.js';




const STATUS_FILTER_OPTIONS = ['', 'Open', 'In Progress', 'On-Hold', 'Closed'];




// Portable (320px) ticket list for end users
export default function UserDashboardPage() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    isLoading,
    allTickets,
    currentPageTickets,
    currentPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortOrder,
    setSortOrder,
    setCurrentPage,
    loadTicketsFromDb,
    handleCreateTicket,
  } = useUserDashboard();



  // Initial load
  useEffect(() => {
    loadTicketsFromDb();
  }, [loadTicketsFromDb]);

  // Live silent refresh via socket
  useRealtimeTicketList(loadTicketsFromDb);



  // Create ticket then open its workspace
  const handleCreateTicketSubmit = async (subject, category, description) => {
    const newTicket = await handleCreateTicket(subject, category, description);
    if (newTicket?.id) {
      navigate(`/workspace/${newTicket.id}`);
    }
    return newTicket;
  };



  return (
    <div className="dashboard-page user-dashboard-page">
      <PageHeader
        compact
        pageTitle="My Tickets"
        actionButton={
          <button type="button" className="btn-primary btn-primary--compact" onClick={() => setIsCreateModalOpen(true)}>
            + New
          </button>
        }
      />

      <main className="dashboard-main user-dashboard-main">
        <div className="user-dashboard-filters">                         {/* search + status + sort */}
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search tickets"
            autoComplete="off"
          />
          <select
            value={filterStatus}
            onChange={(event) => {
              setFilterStatus(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All statuses</option>
            {STATUS_FILTER_OPTIONS.filter(Boolean).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="last_activity">Last activity</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        <div className="user-dashboard-scroll">
          <div className="user-dashboard-list">
            {isLoading ? (
              <p className="user-dashboard-empty">Loading…</p>
            ) : allTickets.length === 0 ? (
              <div className="user-dashboard-empty">
                <div className="empty-icon">🎫</div>
                <p>No tickets yet.</p>
                <button type="button" className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                  Create your first ticket
                </button>
              </div>
            ) : (
              <UserTicketCardList tickets={currentPageTickets} />
            )}
          </div>

          {!isLoading && allTickets.length > 0 && (
            <Pagination
              variant="user-compact"
              hideWhenSinglePage
              currentPage={currentPage}
              totalPages={totalPages}
              onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
          )}
        </div>
      </main>

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmitTicket={handleCreateTicketSubmit}
      />
    </div>
  );
}
