// Imports
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UserTicketRequestHeader from '../../components/user/UserTicketRequestHeader.jsx';
import UserTicketSwitcher from '../../components/user/UserTicketSwitcher.jsx';
import UserWorkspaceHeader from '../../components/user/UserWorkspaceHeader.jsx';
import ChatInput from '../../components/shared/ChatInput.jsx';
import MessageList from '../../components/shared/MessageList.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useUserWorkspace } from '../../hooks/user/useUserWorkspace.js';
import {
  canUserRespondToResolution,
  canUserSendFollowUp,
  getUserReplyBlockedReason,
} from '../../utils/ticketWorkflow.js';




// User request thread: original submission + Q&A with support
export default function UserWorkspacePage() {
  const { ticketId: ticketIdFromRoute } = useParams();
  const { currentUser } = useAuth();

  const {
    allTickets,
    activeTicketId,
    currentTicket,
    messages,
    openTicketById,
    handleSendMessage,
    handleSendAttachment,
    handleResolutionFeedback,
  } = useUserWorkspace(ticketIdFromRoute);



  // Prefer full ticket details; fall back to list item
  const selectedTicket =
    currentTicket ??
    allTickets.find((ticket) => Number(ticket.id) === Number(activeTicketId)) ??
    null;

  const canReply = canUserSendFollowUp(selectedTicket, messages);
  const canConfirmResolution = canUserRespondToResolution(selectedTicket, messages);
  const blockedReason = getUserReplyBlockedReason(selectedTicket, messages);



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



  return (
    <div className="workspace-page user-workspace-page">
      <UserWorkspaceHeader ticket={selectedTicket} />                

      <UserTicketSwitcher
        tickets={allTickets}
        activeTicketId={activeTicketId}
        onSelectTicket={openTicketById}
      />

      <main className="workspace-middle user-workspace-middle">
        <UserTicketRequestHeader ticket={selectedTicket} />

        <MessageList messages={messages} currentUserId={currentUser?.id} />

        {selectedTicket?.status === 'Closed' && (
          <div className="closed-banner closed-banner--compact">
            🔒 Ticket closed. Open a new ticket if you need more help.
          </div>
        )}

        {canConfirmResolution && selectedTicket?.status !== 'Closed' && (
          <div className="resolution-feedback-banner">
            <p className="resolution-feedback-banner__text">
              Did this solution resolve your issue?
            </p>
            <div className="resolution-feedback-banner__actions">
              <button
                type="button"
                className="btn-primary btn-primary--compact"
                onClick={() => handleResolutionFeedback(true)}
              >
                Solved
              </button>
              <button
                type="button"
                className="btn-assign"
                onClick={() => handleResolutionFeedback(false)}
              >
                Not solved
              </button>
            </div>
          </div>
        )}

        {!canReply && !canConfirmResolution && blockedReason && selectedTicket?.status !== 'Closed' && (
          <div className="reply-wait-banner">{blockedReason}</div>
        )}

        <ChatInput
          variant="userAnswer"
          onSendMessage={handleSendMessage}
          onSendAttachment={handleSendAttachment}
          isDisabled={!canReply}
          placeholder="Write your complete answer here…"
          answerHint="Please provide a full answer with all details. This is your reply to support — include everything they need in one message."
        />
      </main>
    </div>
  );
}
