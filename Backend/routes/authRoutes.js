// Imports
const express = require('express');                             // router factory
const router = express.Router();

const {
    login,
    register,
    getMe,
    listUsers,
    getUser,
    createUserAccount,
    updateUserAccount,
    deleteUserAccount,
} = require('../controllers/authController');                   // auth handlers
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); // JWT guard




// Auth routes
router.post('/login', login);                                   // public — returns JWT
router.post('/register', register);                             // public — creates "user" role
router.get('/me', authenticateToken, getMe);                    // needs valid JWT




// Admin account management routes
router.get('/users', authenticateToken, authorizeRoles('admin'), listUsers);
router.get('/users/:id', authenticateToken, authorizeRoles('admin'), getUser);
router.post('/users', authenticateToken, authorizeRoles('admin'), createUserAccount);
router.patch('/users/:id', authenticateToken, authorizeRoles('admin'), updateUserAccount);
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), deleteUserAccount);




module.exports = router;
