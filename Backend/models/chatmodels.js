// Imports
const { query } = require('../config/db');                      // shared MySQL pool helper




// Message queries

// Full thread for a ticket (oldest first)
const getMessagesByTicket = async (ticketId) => {
    const result = await query(
        `SELECT m.id, m.ticket_id, m.sender_id, m.content, m.message_kind, m.is_read,
                m.created_at, u.username AS sender_name,
                m.file_url, m.file_name, m.original_name, m.mime_type, m.file_size
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.ticket_id = ?
         ORDER BY m.created_at ASC`,
        [ticketId]
    );
    return result.rows;
};




// Insert a text / system message and bump ticket.updated_at
const saveMessage = async (ticketId, senderId, content, messageKind = 'user_answer') => {
    const result = await query(
        `INSERT INTO messages (ticket_id, sender_id, content, message_kind)
         VALUES (?, ?, ?, ?)`,
        [ticketId, senderId, content, messageKind]
    );

    await query('UPDATE tickets SET updated_at = NOW() WHERE id = ?', [ticketId]);

    return getMessageById(result.insertId);                     // return full row + sender_name
};




// Mark messages from others as read for this reader
const markMessagesAsRead = async (ticketId, readerId) => {
    await query(
        `UPDATE messages SET is_read = 1
         WHERE ticket_id = ? AND sender_id != ? AND is_read = 0`,
        [ticketId, readerId]
    );
};




// Single message + sender name
const getMessageById = async (messageId) => {
    const result = await query(
        `SELECT m.*, u.username AS sender_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.id = ?`,
        [messageId]
    );
    return result.rows[0] || null;
};




module.exports = {
    getMessagesByTicket,
    saveMessage,
    markMessagesAsRead,
    getMessageById,
};
