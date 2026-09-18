// Imports
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminTicketSidebar from '../../components/admin/AdminTicketSidebar.jsx';
import AdminTicketThreadPanel from '../../components/admin/AdminTicketThreadPanel.jsx';
import AdminWorkspaceHeader from '../../components/admin/AdminWorkspaceHeader.jsx';
import MessageList from '../../components/shared/MessageList.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useAdminWorkspace } from '../../hooks/admin/useAdminWorkspace.js';




// Admin two-column workspace: ticket list + thread
export default function AdminWorkspacePage() {
  const { ticketId: ticketIdFromRoute } = useParams();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    allTickets,
    sidebarPageTickets,
    sidebarCurrentPage,
    sidebarTotalPages,
    sidebarSearchTerm,
    setSidebarSearchTerm,
    sidebarSortOrder,
    setSidebarSortOrder,
    sidebarFilterPriority,
    setSidebarFilterPriority,
    sidebarFilterType,
    setSidebarFilterType,
    setSidebarCurrentPage,
    activeTicketId,
    currentTicket,
    messages,
    openTicketById,
    handleUpdateActiveTicket,
    handleAdminSubmit,
  } = useAdminWorkspace(ticketIdFromRoute);



  // Prefer full ticket details; fall back to sidebar list item
  const selectedTicket =
    currentTicket ??
    allTickets.find((ticket) => Number(ticket.id) === Number(activeTicketId)) ??
    null;



  // Open ticket from route param
  useEffect(() => {
    if (ticketIdFromRoute) {
      openTicketById(ticketIdFromRoute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketIdFromRoute]);

  // Auto-select first ticket when none in URL
  useEffect(() => {
    if (!ticketIdFromRoute && allTickets.length > 0 && !activeTicketId) {
      openTicketById(allTickets[0].id);
    }
  }, [ticketIdFromRoute, allTickets, activeTicketId, openTicketById]);



  // Assign active ticket to current admin
  const handleAssignToMe = () => {
    handleUpdateActiveTicket({ assigned_admin_id: currentUser.id });
  };

  // Wrap admin submit with local submitting flag
  const onAdminSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      await handleAdminSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="workspace-page admin-workspace-page">
      <AdminWorkspaceHeader ticket={selectedTicket} />

      <div className="workspace-grid admin-workspace-grid admin-workspace-grid--two-col">
        <AdminTicketSidebar
          tickets={sidebarPageTickets}
          allTicketsCount={allTickets.length}
          activeTicketId={activeTicketId}
          sidebarCurrentPage={sidebarCurrentPage}
          sidebarTotalPages={sidebarTotalPages}
          sidebarSearchTerm={sidebarSearchTerm}
          sidebarSortOrder={sidebarSortOrder}
          sidebarFilterPriority={sidebarFilterPriority}
          sidebarFilterType={sidebarFilterType}
          onSearchChange={(value) => {
            setSidebarSearchTerm(value);
            setSidebarCurrentPage(1);
          }}
          onSortChange={(value) => {
            setSidebarSortOrder(value);
            setSidebarCurrentPage(1);
          }}
          onFilterPriorityChange={(value) => {
            setSidebarFilterPriority(value);
            setSidebarCurrentPage(1);
          }}
          onFilterTypeChange={(value) => {
            setSidebarFilterType(value);
            setSidebarCurrentPage(1);
          }}
          onTicketClick={openTicketById}
          onPreviousPage={() => setSidebarCurrentPage((page) => Math.max(1, page - 1))}
          onNextPage={() =>
            setSidebarCurrentPage((page) => Math.min(sidebarTotalPages, page + 1))
          }
        />

        <main className="workspace-middle admin-workspace-middle">
          <div className="admin-thread-meta">
            <AdminTicketThreadPanel
              ticket={selectedTicket}
              currentUserId={currentUser?.id}
              onAssignToMe={handleAssignToMe}
              onAdminSubmit={onAdminSubmit}
              isSubmitting={isSubmitting}
            />
          </div>

          <div className="admin-thread-chat">
            <MessageList messages={messages} currentUserId={currentUser?.id} />

            {selectedTicket?.status === 'Closed' && (
              <div className="closed-banner">
                🔒 This ticket is closed. No further responses can be sent.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
