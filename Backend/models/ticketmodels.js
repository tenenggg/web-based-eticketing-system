// Imports
const { query } = require('../config/db');                      // shared MySQL pool helper




// Ticket helpers

// Next display number: TKT-0001, TKT-0002, …
const getNextTicketNumber = async () => {
    const result = await query('SELECT MAX(id) AS max_id FROM tickets');
    const maxId = result.rows[0].max_id || 0;
    const nextId = maxId + 1;
    return `TKT-${String(nextId).padStart(4, '0')}`;
};




// Normalize status strings from the client into DB canonical values
const normalizeStatus = (status) => {
    if (status === undefined || status === null) return status;

    const compact = String(status).trim().toLowerCase().replace(/[-\s_]+/g, '');

    if (compact === 'onhold') return 'On-Hold';
    if (compact === 'inprogress') return 'In Progress';
    if (compact === 'closed') return 'Closed';
    if (compact === 'open') return 'Open';

    return status;                                              // pass through unknown values
};




// Create ticket row (initial request message is saved by the controller)
const createTicket = async (userId, subject, category = 'General', description = '') => {
    const ticketNumber = await getNextTicketNumber();
    const trimmedDescription = (description || '').trim();

    const result = await query(
        `INSERT INTO tickets (ticket_number, user_id, subject, description, category, status, priority)
         VALUES (?, ?, ?, ?, ?, 'Open', 'Medium')`,
        [ticketNumber, userId, subject, trimmedDescription || null, category]
    );

    return getTicketById(result.insertId);
};




// Single ticket + usernames
const getTicketById = async (ticketId) => {
    const result = await query(
        `SELECT t.*,
                u.username AS user_username,
                a.username AS admin_username
         FROM tickets t
         JOIN users u ON t.user_id = u.id
         LEFT JOIN users a ON t.assigned_admin_id = a.id
         WHERE t.id = ?`,
        [ticketId]
    );
    return result.rows[0] || null;
};




// Admin list — unread = unread messages sent by the ticket owner
const getAllTickets = async ({ status, assignedAdminId } = {}) => {
    let sql = `
        SELECT t.*,
               u.username AS user_username,
               a.username AS admin_username,
               (SELECT COUNT(*) FROM messages m
                WHERE m.ticket_id = t.id AND m.is_read = 0 AND m.sender_id = t.user_id) AS unread_count,
               (SELECT MAX(m2.created_at) FROM messages m2 WHERE m2.ticket_id = t.id) AS last_message_time
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.assigned_admin_id = a.id
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        sql += ' AND t.status = ?';
        params.push(status);
    }
    if (assignedAdminId) {
        sql += ' AND t.assigned_admin_id = ?';
        params.push(assignedAdminId);
    }

    sql += ' ORDER BY (last_message_time IS NULL), last_message_time DESC, t.created_at DESC';

    const result = await query(sql, params);
    return result.rows;
};




// User list — unread = unread messages NOT from the ticket owner
const getTicketsByUser = async (userId) => {
    const result = await query(
        `SELECT t.*,
                a.username AS admin_username,
                (SELECT COUNT(*) FROM messages m
                 WHERE m.ticket_id = t.id AND m.is_read = 0 AND m.sender_id != t.user_id) AS unread_count,
                (SELECT MAX(m.created_at) FROM messages m WHERE m.ticket_id = t.id) AS last_message_time
         FROM tickets t
         LEFT JOIN users a ON t.assigned_admin_id = a.id
         WHERE t.user_id = ?
         ORDER BY (last_message_time IS NULL), last_message_time DESC, t.created_at DESC`,
        [userId]
    );
    return result.rows;
};




// Patch allowed ticket fields
const updateTicket = async (ticketId, fields) => {
    const allowed = ['status', 'priority', 'category', 'assigned_admin_id'];
    const setClauses = [];
    const params = [];

    const normalizedFields = {
        ...fields,
        status: normalizeStatus(fields.status),
    };

    for (const key of allowed) {
        if (normalizedFields[key] !== undefined) {
            setClauses.push(`${key} = ?`);
            params.push(normalizedFields[key]);
        }
    }

    if (normalizedFields.status === 'Closed') {
        setClauses.push('closed_at = NOW()');                   // trigger fills time_taken_minutes
    } else if (normalizedFields.status && normalizedFields.status !== 'Closed') {
        setClauses.push('closed_at = NULL');                    // reopen clears close time
        setClauses.push('time_taken_minutes = NULL');
    }

    if (setClauses.length === 0) return null;

    params.push(ticketId);
    await query(`UPDATE tickets SET ${setClauses.join(', ')} WHERE id = ?`, params);
    return getTicketById(ticketId);
};




// Save file as a chat message row (caption optional; falls back to original filename)
const saveAttachment = async ({
    ticketId,
    senderId,
    filename,
    originalName,
    mimeType,
    fileSize,
    fileUrl,
    messageKind = 'user_answer',
    caption = '',
}) => {
    const trimmedCaption = typeof caption === 'string' ? caption.trim() : '';
    const textContent = trimmedCaption || originalName;

    const result = await query(
        `INSERT INTO messages (ticket_id, sender_id, content, message_kind, file_url, file_name, original_name, mime_type, file_size)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ticketId, senderId, textContent, messageKind, fileUrl, filename, originalName, mimeType, fileSize]
    );

    const msgResult = await query(
        `SELECT m.*, u.username AS sender_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.id = ?`,
        [result.insertId]
    );

    const message = msgResult.rows[0];

    return {
        id: result.insertId,
        ticket_id: ticketId,
        sender_id: senderId,
        file_url: fileUrl,
        file_name: filename,
        original_name: originalName,
        mime_type: mimeType,
        file_size: fileSize,
        message,                                                // full row for socket broadcast
    };
};




module.exports = {
    createTicket,
    getTicketById,
    getAllTickets,
    getTicketsByUser,
    updateTicket,
    saveAttachment,
};
