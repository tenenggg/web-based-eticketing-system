// Imports
const { query } = require('../config/db');                      // shared MySQL pool helper




// Find user by username (login / register uniqueness check)
const findByUsername = async (username) => {
    const result = await query('SELECT * FROM users WHERE username = ?', [username]);
    return result.rows[0] || null;
};




// Public profile by id — used by GET /api/auth/me
const findById = async (id) => {
    const result = await query(
        'SELECT id, username, role FROM users WHERE id = ?',
        [id]
    );
    return result.rows[0] || null;
};




// Insert new user — role defaults to "user"
const createUser = async (username, passwordHash, role = 'user') => {
    const result = await query(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        [username, passwordHash, role]
    );

    return {
        id: result.insertId,
        username,
        role,
    };
};




module.exports = {
    findByUsername,
    findById,
    createUser,
};
