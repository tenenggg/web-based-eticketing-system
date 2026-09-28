// Imports
const bcrypt = require('bcryptjs');                             // password hashing
const jwt = require('jsonwebtoken');                            // JWT create / verify
const authModel = require('../models/authmodels');              // users table helpers




const sanitizeUser = (user) => ({
    id: user.id,
    username: user.username,
    role: user.role,
});




const validateAccountBody = (username, role, password = null, isCreate = false) => {
    const trimmedUsername = String(username || '').trim();
    const cleanedRole = String(role || '').trim();

    if (!trimmedUsername) {
        return 'Username is required';
    }

    if (!['admin', 'user'].includes(cleanedRole)) {
        return 'Role must be admin or user';
    }

    if (isCreate && (!password || String(password).trim() === '')) {
        return 'Password is required';
    }

    return null;
};




// POST /api/auth/register — always creates a normal "user" account
const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const existingUser = await authModel.findByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);   // cost factor 10
        const newUser = await authModel.createUser(username, passwordHash);

        res.status(201).json({
            message: 'User registered successfully',
            user: sanitizeUser(newUser),
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




// POST /api/auth/login — returns JWT + public user payload
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await authModel.findByUsername(username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const tokenPayload = {
            id: user.id,
            username: user.username,
            role: user.role,
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Login successful',
            token,
            user: tokenPayload,
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




// GET /api/auth/me — role refreshed from DB (not only from JWT)
const getMe = async (req, res) => {
    try {
        const user = await authModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: sanitizeUser(user),
        });

    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




// GET /api/auth/users — admin-only list
const listUsers = async (req, res) => {
    try {
        const users = await authModel.findAllUsers();
        res.json({ users: users.map(sanitizeUser) });
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




// GET /api/auth/users/:id — admin-only single record
const getUser = async (req, res) => {
    try {
        const user = await authModel.findUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user: sanitizeUser(user) });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




// POST /api/auth/users — admin creates a new account
const createUserAccount = async (req, res) => {
    try {
        const { username, password, role = 'user' } = req.body;
        const validationError = validateAccountBody(username, role, password, true);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const existingUser = await authModel.findByUsername(username.trim());
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const createdUser = await authModel.createUser(username.trim(), passwordHash, role.trim());

        res.status(201).json({
            message: 'Account created successfully',
            user: sanitizeUser(createdUser),
        });
    } catch (error) {
        console.error('Create user account error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




// PATCH /api/auth/users/:id — admin updates an account
const updateUserAccount = async (req, res) => {
    try {
        const targetId = Number(req.params.id);
        const targetUser = await authModel.findUserById(targetId);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { username, role = targetUser.role, password } = req.body;
        const trimmedUsername = String(username ?? targetUser.username).trim();
        const cleanedRole = String(role ?? targetUser.role).trim();
        const validationError = validateAccountBody(trimmedUsername, cleanedRole, password, false);

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        if (trimmedUsername !== targetUser.username) {
            const duplicateUser = await authModel.findByUsername(trimmedUsername);
            if (duplicateUser && duplicateUser.id !== targetId) {
                return res.status(409).json({ message: 'Username already exists' });
            }
        }

        if (targetUser.role === 'admin' && cleanedRole === 'user') {
            const adminCount = await authModel.countAdmins();
            if (adminCount <= 1) {
                return res.status(403).json({ message: 'At least one admin account must remain' });
            }
        }

        const passwordHash = password && String(password).trim() ? await bcrypt.hash(password, 10) : null;
        await authModel.updateUser(targetId, {
            username: trimmedUsername,
            role: cleanedRole,
            passwordHash,
        });

        const updatedUser = await authModel.findUserById(targetId);
        res.json({
            message: 'Account updated successfully',
            user: sanitizeUser(updatedUser),
        });
    } catch (error) {
        console.error('Update user account error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




// DELETE /api/auth/users/:id — admin deletes an account
const deleteUserAccount = async (req, res) => {
    try {
        const targetId = Number(req.params.id);
        const currentUserId = Number(req.user.id);

        if (targetId === currentUserId) {
            return res.status(403).json({ message: 'You cannot delete your own account' });
        }

        const targetUser = await authModel.findUserById(targetId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetUser.role === 'admin') {
            const adminCount = await authModel.countAdmins();
            if (adminCount <= 1) {
                return res.status(403).json({ message: 'At least one admin account must remain' });
            }
        }

        await authModel.deleteUser(targetId);

        res.json({
            message: 'Account deleted successfully',
            deletedUserId: targetId,
        });
    } catch (error) {
        console.error('Delete user account error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




module.exports = {
    register,
    login,
    getMe,
    listUsers,
    getUser,
    createUserAccount,
    updateUserAccount,
    deleteUserAccount,
};
