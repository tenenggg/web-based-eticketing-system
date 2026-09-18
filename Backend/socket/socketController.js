// Imports
const ticketModels = require('../models/ticketmodels');         // ticket lookup / ownership
const chatModels = require('../models/chatmodels');             // save / load messages
const {
    canUserSendFollowUp,
    canUserRespondToResolution,
    normalizeAdminReplyType,
    USER_ANSWER,
    ADMIN_SOLUTION,
    RESOLUTION_PROMPT,
    USER_SOLVED,
    USER_NOT_SOLVED,
} = require('../utils/ticketWorkflow');                         // reply rules + kinds




// Broadcast a saved message to ticket room, admins, and the ticket owner
function broadcastMessage(io, ticket, message) {
    const ticketId = ticket.id;
    io.to(`ticket_${ticketId}`).emit('receive_message', message);
    io.to('admins').emit('receive_message', message);
    io.to(`user_${ticket.user_id}`).emit('receive_message', message);
}




// User sends a follow-up answer — socket event: send_message
const handleUserMessage = async (socket, io, { ticketId, content }) => {
    try {
        const ticket = await ticketModels.getTicketById(ticketId);
        if (!ticket) {
            return socket.emit('message_error', { error: 'Ticket not found' });
        }

        if (Number(ticket.user_id) !== Number(socket.user.id)) {
            return socket.emit('message_error', { error: 'You do not have access to this ticket' });
        }

        if (ticket.status === 'Closed') {
            return socket.emit('message_error', { error: 'This ticket is closed. Please open a new ticket.' });
        }

        const thread = await chatModels.getMessagesByTicket(ticketId);
        if (!canUserSendFollowUp(ticket, thread)) {
            return socket.emit('message_error', {
                error: 'You can reply only after an assigned agent asks a question.',
            });
        }

        const savedMessage = await chatModels.saveMessage(
            ticketId,
            socket.user.id,
            content,
            USER_ANSWER
        );

        broadcastMessage(io, ticket, savedMessage);
        socket.emit('message_sent', savedMessage);

    } catch (err) {
        console.error('[User Message] Error:', err);
        socket.emit('message_error', { error: 'Could not send message' });
    }
};




// Admin sends question or solution — socket event: admin_reply
const handleAdminReply = async (socket, io, onlineUsers, { ticketId, content, replyType }) => {
    try {
        if (socket.user.role !== 'admin') {
            return socket.emit('message_error', { error: 'Forbidden: admin reply only' });
        }

        const trimmed = (content || '').trim();
        if (!trimmed) {
            return socket.emit('message_error', { error: 'Response text is required.' });
        }

        const ticket = await ticketModels.getTicketById(ticketId);
        if (!ticket) {
            return socket.emit('message_error', { error: 'Ticket not found' });
        }

        if (ticket.status === 'Closed') {
            return socket.emit('message_error', { error: 'Ticket is closed.' });
        }

        if (
            !ticket.assigned_admin_id ||
            Number(ticket.assigned_admin_id) !== Number(socket.user.id)
        ) {
            return socket.emit('message_error', {
                error: 'Assign this ticket to yourself before responding.',
            });
        }

        const messageKind = normalizeAdminReplyType(replyType);
        const savedMessage = await chatModels.saveMessage(
            ticketId,
            socket.user.id,
            trimmed,
            messageKind
        );

        broadcastMessage(io, ticket, savedMessage);
        socket.emit('message_sent', savedMessage);

        // Solution → auto-ask user if the issue is solved
        if (messageKind === ADMIN_SOLUTION) {
            const promptMessage = await chatModels.saveMessage(
                ticketId,
                socket.user.id,
                'Was this solution helpful? Please confirm whether your issue is solved.',
                RESOLUTION_PROMPT
            );
            broadcastMessage(io, ticket, promptMessage);
        }

    } catch (err) {
        console.error('[Admin Reply] Error:', err);
        socket.emit('message_error', { error: 'Could not send message' });
    }
};




// User clicks Solved / Not solved — socket event: resolution_feedback
const handleResolutionFeedback = async (socket, io, { ticketId, resolved }) => {
    try {
        const ticket = await ticketModels.getTicketById(ticketId);
        if (!ticket) {
            return socket.emit('message_error', { error: 'Ticket not found' });
        }

        if (Number(ticket.user_id) !== Number(socket.user.id)) {
            return socket.emit('message_error', { error: 'You do not have access to this ticket' });
        }

        if (ticket.status === 'Closed') {
            return socket.emit('message_error', { error: 'This ticket is closed. Please open a new ticket.' });
        }

        const thread = await chatModels.getMessagesByTicket(ticketId);
        if (!canUserRespondToResolution(ticket, thread)) {
            return socket.emit('message_error', {
                error: 'You can only confirm resolution after support provides a solution.',
            });
        }

        const isSolved = Boolean(resolved);
        const savedMessage = await chatModels.saveMessage(
            ticketId,
            socket.user.id,
            isSolved
                ? 'Solved — the solution fixed my issue.'
                : 'Not solved — I still need help with this issue.',
            isSolved ? USER_SOLVED : USER_NOT_SOLVED
        );

        broadcastMessage(io, ticket, savedMessage);
        socket.emit('message_sent', savedMessage);

    } catch (err) {
        console.error('[Resolution Feedback] Error:', err);
        socket.emit('message_error', { error: 'Could not submit resolution feedback' });
    }
};




module.exports = {
    handleUserMessage,
    handleAdminReply,
    handleResolutionFeedback,
};
