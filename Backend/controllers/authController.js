// Imports
const bcrypt = require('bcryptjs');                             // password hashing
const jwt = require('jsonwebtoken');                            // JWT create / verify
const authModel = require('../models/authmodels');              // users table helpers




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
            user: {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role,
            },
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
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });

    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




module.exports = {
    register,
    login,
    getMe,
};
