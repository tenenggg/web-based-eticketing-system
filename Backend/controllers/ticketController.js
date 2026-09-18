// Imports
const ticketModel = require('../models/ticketmodels');          // tickets + attachments
const chatModel = require('../models/chatmodels');              // message thread helpers
const {
    canUserSendFollowUp,
    USER_REQUEST,
    TICKET_ASSIGNED,
} = require('../utils/ticketWorkflow');                         // reply rules + message kinds




// POST /api/tickets — user creates a support ticket (+ initial request message for unread dots)
const createTicket = async (req, res) => {
    try {
        const userId = req.user.id;
        const { subject, category, description } = req.body;

        if (req.user.role === 'admin') {
            return res.status(403).json({ message: 'Admins cannot create tickets' });
        }

        if (!subject || subject.trim() === '') {
            return res.status(400).json({ message: 'Subject is required to create a ticket' });
        }

        if (!description || description.trim() === '') {
            return res.status(400).json({ message: 'Description is required to create a ticket' });
        }

        const ticket = await ticketModel.createTicket(
            userId,
            subject.trim(),
            category || 'General',
            description.trim()
        );

        // Seed thread so admins get an unread blue-dot notification
        const initialMessage = await chatModel.saveMessage(
            ticket.id,
            userId,
            description.trim(),
            USER_REQUEST
        );

        const io = req.app.get('io');
        if (io) {
            io.to('admins').emit('ticket_created', ticket);     // refresh admin list
            io.to('admins').emit('receive_message', initialMessage);
            io.to(`user_${userId}`).emit('receive_message', initialMessage); // user room
        }

        res.status(201).json(ticket);

    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ message: 'Server error' });
    }
};




// GET /api/tickets — admin: all tickets | user: own tickets only
const getTickets = async (req, res) => {
    try {
        const tickets = req.user.role === 'admin'
            ? await ticketModel.getAllTickets()
            : await ticketModel.getTicketsByUser(req.user.id);

        res.json(tickets);

    } catch (err) {
        console.error('Error fetching tickets:', err);
        res.status(500).json({ message: 'Server error' });
    }
};




// GET /api/tickets/:ticketId — single ticket (owner or admin)
const getTicket = async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        const ticket = await ticketModel.getTicketById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (req.user.role !== 'admin' && Number(ticket.user_id) !== Number(req.user.id)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        res.json(ticket);

    } catch (err) {
        console.error('Error fetching ticket:', err);
        res.status(500).json({ message: 'Server error' });
    }
};




// PATCH /api/tickets/:ticketId — admin updates fields / assigns self
const updateTicket = async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        const { status, priority, category, assigned_admin_id } = req.body;

        const ticket = await ticketModel.getTicketById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Type / status / priority require the current admin to already be assignee
        const updatingClassification =
            status !== undefined || priority !== undefined || category !== undefined;

        if (updatingClassification) {
            if (
                !ticket.assigned_admin_id ||
                Number(ticket.assigned_admin_id) !== Number(req.user.id)
            ) {
                return res.status(403).json({
                    message: 'Assign this ticket to yourself before updating or responding.',
                });
            }
        }

        const updated = await ticketModel.updateTicket(ticketId, {
            status,
            priority,
            category,
            assigned_admin_id,
        });

        if (!updated) {
            return res.status(400).json({ message: 'No valid fields provided for update' });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`ticket_${ticketId}`).emit('ticket_updated', updated);
            io.to('admins').emit('ticket_updated', updated);
            io.to(`user_${updated.user_id}`).emit('ticket_updated', updated); // user room
        }

        // New assignee → system message so the user gets an unread notification
        const assigneeChanged =
            assigned_admin_id !== undefined &&
            updated.assigned_admin_id &&
            Number(updated.assigned_admin_id) !== Number(ticket.assigned_admin_id);

        if (assigneeChanged) {
            const adminName = updated.admin_username || 'Support';
            const assignNotice = await chatModel.saveMessage(
                ticketId,
                updated.assigned_admin_id,
                `${adminName} has been assigned to your ticket.`,
                TICKET_ASSIGNED
            );

            if (io) {
                io.to(`ticket_${ticketId}`).emit('receive_message', assignNotice);
                io.to('admins').emit('receive_message', assignNotice);
                io.to(`user_${updated.user_id}`).emit('receive_message', assignNotice);
            }
        }

        res.json(updated);

    } catch (err) {
        console.error('Error updating ticket:', err);
        res.status(500).json({ message: 'Server error' });
    }
};




// POST /api/tickets/:ticketId/attachments — image/PDF upload (+ optional caption)
const uploadAttachment = async (req, res) => {
    try {
        const ticketId = req.params.ticketId;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const ticket = await ticketModel.getTicketById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (req.user.role !== 'admin' && Number(ticket.user_id) !== Number(req.user.id)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (ticket.status === 'Closed') {
            return res.status(400).json({ message: 'Cannot upload to a closed ticket' });
        }

        if (req.user.role !== 'admin') {
            const thread = await chatModel.getMessagesByTicket(ticketId);
            if (!canUserSendFollowUp(ticket, thread)) {
                return res.status(403).json({
                    message: 'You can attach files only when answering an agent question.',
                });
            }
        } else if (
            !ticket.assigned_admin_id ||
            Number(ticket.assigned_admin_id) !== Number(req.user.id)
        ) {
            return res.status(403).json({
                message: 'Assign this ticket to yourself before uploading attachments.',
            });
        }

        const fileUrl = `/uploads/attachments/${ticketId}/${req.file.filename}`;
        const caption = typeof req.body?.caption === 'string' ? req.body.caption.trim() : '';

        const attachment = await ticketModel.saveAttachment({
            ticketId,
            senderId: req.user.id,
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            fileUrl,
            caption,
        });

        const io = req.app.get('io');
        if (io) {
            io.to(`ticket_${ticketId}`).emit('receive_message', attachment.message);
            io.to('admins').emit('receive_message', attachment.message);
            io.to(`user_${ticket.user_id}`).emit('receive_message', attachment.message);
        }

        res.status(201).json(attachment);

    } catch (err) {
        console.error('Error uploading attachment:', err);
        res.status(500).json({ message: 'Server error' });
    }
};




// GET /api/tickets/:ticketId/log — admin PDF export payload { ticket, messages }
const getTicketLog = async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        const ticket = await ticketModel.getTicketById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const messages = await chatModel.getMessagesByTicket(ticketId);
        res.json({ ticket, messages });                         // frontend builds the PDF

    } catch (err) {
        console.error('Error fetching ticket log:', err);
        res.status(500).json({ message: 'Server error' });
    }
};




module.exports = {
    createTicket,
    getTickets,
    getTicket,
    updateTicket,
    uploadAttachment,
    getTicketLog,
};
