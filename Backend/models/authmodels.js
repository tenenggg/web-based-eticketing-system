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




// List accounts with public fields only
const findAllUsers = async () => {
    const result = await query(
        'SELECT id, username, role FROM users ORDER BY username ASC'
    );
    return result.rows;
};




// Find one account by id without exposing password hash
const findUserById = async (id) => {
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




// Update account username/role and optionally password
const updateUser = async (id, { username, role, passwordHash = null }) => {
    const params = [username, role];
    let sql = 'UPDATE users SET username = ?, role = ?';

    if (passwordHash) {
        sql += ', password_hash = ?';
        params.push(passwordHash);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    const result = await query(sql, params);
    return result;
};




// Permanently delete a user
const deleteUser = async (id) => {
    const result = await query('DELETE FROM users WHERE id = ?', [id]);
    return result;
};




// Count how many admins remain
const countAdmins = async () => {
    const result = await query('SELECT COUNT(*) AS total FROM users WHERE role = ?', ['admin']);
    return Number(result.rows[0]?.total || 0);
};




module.exports = {
    findByUsername,
    findById,
    findAllUsers,
    findUserById,
    createUser,
    updateUser,
    deleteUser,
    countAdmins,
};
