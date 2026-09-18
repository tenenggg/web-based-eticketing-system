// Imports
const express = require('express');                             // router factory
const router = express.Router();

const { getMessages, markAsRead } = require('../controllers/chatController'); // chat handlers
const { authenticateToken } = require('../middleware/authMiddleware');         // JWT on every route




// Chat routes — JWT required on every endpoint
router.get('/tickets/:ticketId/messages', authenticateToken, getMessages);  // load thread
router.post('/tickets/:ticketId/read', authenticateToken, markAsRead);      // clear unread




module.exports = router;
