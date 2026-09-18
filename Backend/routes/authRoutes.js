// Imports
const express = require('express');                             // router factory
const router = express.Router();

const { login, register, getMe } = require('../controllers/authController'); // auth handlers
const { authenticateToken } = require('../middleware/authMiddleware');       // JWT guard




// Auth routes
router.post('/login', login);                                   // public — returns JWT
router.post('/register', register);                             // public — creates "user" role
router.get('/me', authenticateToken, getMe);                    // needs valid JWT




module.exports = router;
