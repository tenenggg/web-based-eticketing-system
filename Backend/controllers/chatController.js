// Imports
const ticketModel = require('../models/ticketmodels');          // ticket ownership checks
const chatModel = require('../models/chatmodels');              // message queries




// GET /api/chat/tickets/:ticketId/messages — full message thread for a ticket
const getMessages = async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        const ticket = await ticketModel.getTicketById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Users may only read their own tickets; admins may read any
        if (req.user.role !== 'admin' && Number(ticket.user_id) !== Number(req.user.id)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const messages = await chatModel.getMessagesByTicket(ticketId);
        res.json(messages);

    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ message: 'Server error' });
    }
};




// POST /api/chat/tickets/:ticketId/read — clear unread for the current reader
const markAsRead = async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        await chatModel.markMessagesAsRead(ticketId, req.user.id);
        res.json({ message: 'Messages marked as read' });

    } catch (err) {
        console.error('Error marking as read:', err);
        res.status(500).json({ message: 'Server error' });
    }
};




module.exports = {
    getMessages,
    markAsRead,
};
