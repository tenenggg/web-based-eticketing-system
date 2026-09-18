import { useEffect } from 'react';
import PageHeader from '../../components/shared/PageHeader.jsx';                       // a simple header with a title and a back button
import Pagination from '../../components/shared/Pagination.jsx';                      // a simple pagination component (pagination for the table)
import AdminTicketTable from '../../components/admin/AdminTicketTable.jsx';           // the table component for the admin dashboard page
import { useRealtimeTicketList } from '../../hooks/shared/useRealtimeTicketList.js';  // a hook to update the ticket list in real-time using websockets
import { useAdminDashboard } from '../../hooks/admin/useAdminDashboard.js';          // a hook to get the data for the admin dashboard page




// Filter option lists the dropdown options for the filters in the admin dashboard page
// we dont make it into a useState hook because it is static and never changes
// and we dont need to re-render it unnecessarily
// unlike the useState hooks that are used to store the data that changes over time
const CATEGORY_FILTER_OPTIONS = ['', 'General', 'Technical', 'Billing', 'Bug Report', 'Other'];
const STATUS_FILTER_OPTIONS = ['', 'Open', 'In Progress', 'On-Hold', 'Closed'];
const PRIORITY_FILTER_OPTIONS = ['', 'Low', 'Medium', 'High', 'Urgent'];




// Admin desktop ticket list
export default function AdminDashboardPage() {
  const {
    isLoading,
    allTickets,
    currentPageTickets,
    currentPage,
    totalPages,
    pageSize,
    startIndex,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    sortOrder,
    setSortOrder,
    filterAssignedToMe,
    setFilterAssignedToMe,
    setCurrentPage,
    loadTicketsFromDb,
  } = useAdminDashboard();                // destructure the data from the hook, for easier access



  // Initial load
  useEffect(() => {
    loadTicketsFromDb();
  }, [loadTicketsFromDb]);

  // Live silent refresh via socket
  useRealtimeTicketList(loadTicketsFromDb);



  return (
    <div className="dashboard-page admin-dashboard-page">
      <PageHeader pageTitle="Support Request" />

      <main className="dashboard-main">
        <div className="table-controls">                                  {/* search + filters row */}
          <div className="search-wrap">
            <span className="search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);                                        // reset page on filter change
              }}
              placeholder="search ticket's subject"
              autoComplete="off"
            />
          </div>

          <div className="filters-wrap">
            <button
              type="button"
              className={`btn-secondary filter-assigned-btn ${filterAssignedToMe ? 'btn-primary' : ''}`}
              onClick={() => {
                setFilterAssignedToMe((previous) => !previous);
                setCurrentPage(1);
              }}
            >
              Assigned to me
            </button>

            <select
              value={filterCategory}
              onChange={(event) => {
                setFilterCategory(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Types</option>
              {CATEGORY_FILTER_OPTIONS.filter(Boolean).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(event) => {
                setFilterStatus(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              {STATUS_FILTER_OPTIONS.filter(Boolean).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(event) => {
                setFilterPriority(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Priorities</option>
              {PRIORITY_FILTER_OPTIONS.filter(Boolean).map((option) => (
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
              <option value="last_activity">Sort: Last Activity</option>
              <option value="newest">Sort: Newest</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          {isLoading ? (
            <div className="table-empty-state">
              <p>Loading tickets...</p>
            </div>
          ) : allTickets.length === 0 ? (
            <div className="table-empty-state">
              <div className="empty-icon">🎫</div>
              <p>No tickets found.</p>
            </div>
          ) : (
            <AdminTicketTable tickets={currentPageTickets} />
          )}
        </div>

        {!isLoading && allTickets.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            totalItems={allTickets.length}
            pageSize={pageSize}
            onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          />
        )}
      </main>
    </div>
  );
}
