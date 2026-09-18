// Message kind constants — keep in sync with Backend/utils/ticketWorkflow.js
export const ADMIN_QUESTION = 'admin_question';
export const ADMIN_SOLUTION = 'admin_solution';
export const USER_ANSWER = 'user_answer';
export const USER_REQUEST = 'user_request';
export const TICKET_ASSIGNED = 'ticket_assigned';
export const RESOLUTION_PROMPT = 'resolution_prompt';
export const USER_SOLVED = 'user_solved';
export const USER_NOT_SOLVED = 'user_not_solved';




// User may reply only when assigned + last message is an admin question
export function canUserSendFollowUp(ticket, messages) {
  if (!ticket || ticket.status === 'Closed') return false;
  if (!ticket.assigned_admin_id) return false;
  if (!messages?.length) return false;

  const last = messages[messages.length - 1];
  return last.message_kind === ADMIN_QUESTION;
}




// User may click Solved / Not solved after a solution prompt
export function canUserRespondToResolution(ticket, messages) {
  if (!ticket || ticket.status === 'Closed') return false;
  if (!ticket.assigned_admin_id) return false;
  if (!messages?.length) return false;

  const last = messages[messages.length - 1];
  return last.message_kind === RESOLUTION_PROMPT;
}




// Banner text when user cannot reply yet
export function getUserReplyBlockedReason(ticket, messages) {
  if (!ticket) return 'Select a ticket.';
  if (ticket.status === 'Closed') return 'This ticket is closed.';
  if (!ticket.assigned_admin_id) return 'Waiting for an agent to be assigned.';
  if (canUserRespondToResolution(ticket, messages)) return null;
  if (!canUserSendFollowUp(ticket, messages)) {
    return 'You can respond only when support asks a question.';
  }
  return null;
}




// Label above a chat bubble by message_kind
export function messageKindLabel(kind, isSentByCurrentUser) {
  if (kind === TICKET_ASSIGNED) return 'Assignment update';
  if (kind === ADMIN_SOLUTION) return 'Solution from support';
  if (kind === ADMIN_QUESTION) return 'Question from support';
  if (kind === RESOLUTION_PROMPT) return 'Confirm resolution';
  if (kind === USER_SOLVED) return isSentByCurrentUser ? 'You confirmed solved' : 'Customer confirmed solved';
  if (kind === USER_NOT_SOLVED) return isSentByCurrentUser ? 'You reported not solved' : 'Customer reported not solved';
  if (kind === USER_REQUEST) return isSentByCurrentUser ? 'Your request' : 'Initial request';
  if (kind === USER_ANSWER) return isSentByCurrentUser ? 'Your answer' : 'Customer answer';
  return null;
}
