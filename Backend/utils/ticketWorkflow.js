// Message kinds — keep in sync with frontend/src/utils/ticketWorkflow.js
const ADMIN_QUESTION = 'admin_question';                        // admin asks the user something
const ADMIN_SOLUTION = 'admin_solution';                        // admin proposes a fix
const USER_ANSWER = 'user_answer';                              // user replies to a question
const USER_REQUEST = 'user_request';                            // initial ticket description seed
const TICKET_ASSIGNED = 'ticket_assigned';                      // system notice when admin claims ticket
const RESOLUTION_PROMPT = 'resolution_prompt';                  // auto ask: solved or not?
const USER_SOLVED = 'user_solved';                              // user clicked Solved
const USER_NOT_SOLVED = 'user_not_solved';                      // user clicked Not solved




// Reply rules

// User may reply only when assigned + last message is an admin question
function canUserSendFollowUp(ticket, messages) {
    if (!ticket || ticket.status === 'Closed') return false;
    if (!ticket.assigned_admin_id) return false;                // must have an assignee
    if (!messages || messages.length === 0) return false;

    const last = messages[messages.length - 1];
    return last.message_kind === ADMIN_QUESTION;                // only after an open question
}




// User may click Solved / Not solved after a solution prompt
function canUserRespondToResolution(ticket, messages) {
    if (!ticket || ticket.status === 'Closed') return false;
    if (!ticket.assigned_admin_id) return false;
    if (!messages || messages.length === 0) return false;

    const last = messages[messages.length - 1];
    return last.message_kind === RESOLUTION_PROMPT;
}




// Map admin UI replyType → DB message_kind
function normalizeAdminReplyType(replyType) {
    if (replyType === 'solution') return ADMIN_SOLUTION;
    return ADMIN_QUESTION;                                      // default: question
}




module.exports = {
    ADMIN_QUESTION,
    ADMIN_SOLUTION,
    USER_ANSWER,
    USER_REQUEST,
    TICKET_ASSIGNED,
    RESOLUTION_PROMPT,
    USER_SOLVED,
    USER_NOT_SOLVED,
    canUserSendFollowUp,
    canUserRespondToResolution,
    normalizeAdminReplyType,
};
