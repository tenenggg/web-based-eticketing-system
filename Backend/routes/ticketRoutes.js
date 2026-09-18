// Imports
const express = require('express');                             // router factory
const router = express.Router();

const {
    createTicket,
    getTickets,
    getTicket,
    updateTicket,
    uploadAttachment,
    getTicketLog,
} = require('../controllers/ticketController');                 // ticket handlers

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); // JWT + roles
const { upload } = require('../middleware/uploadMiddleware');   // multer "file" field




// Ticket routes
router.post('/', authenticateToken, createTicket);              // user creates a ticket
router.get('/', authenticateToken, getTickets);                 // list tickets (role-based)
router.get('/:ticketId/log', authenticateToken, authorizeRoles('admin'), getTicketLog); // PDF log data
router.get('/:ticketId', authenticateToken, getTicket);         // single ticket details
router.patch('/:ticketId', authenticateToken, authorizeRoles('admin'), updateTicket); // update / assign

router.post(                                                    // multipart attachment upload
    '/:ticketId/attachments',
    authenticateToken,
    upload.single('file'),                                      // field name must be "file"
    uploadAttachment
);




module.exports = router;
