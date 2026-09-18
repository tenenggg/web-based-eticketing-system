// Imports
const mysql = require('mysql2/promise');                        // MySQL driver (promise API)
require('dotenv').config();                                     // load DB_* from .env




// MySQL connection pool — shared by all models via query()
const pool = mysql.createPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,                                   // queue callers when all connections busy
    connectionLimit: 10,                                        // max concurrent connections
    queueLimit: 0,                                               // unlimited wait queue
});




// Run SQL and return a simple { rows, ... } shape for SELECT / INSERT
const query = async (sql, params = []) => {
    const [result] = await pool.execute(sql, params);

    if (Array.isArray(result)) {
        return { rows: result };                                // SELECT → array of rows
    }

    return {
        rows: [],
        ...result,                                              // insertId, affectedRows, etc.
    };
};




module.exports = {
    query,
    pool,
};
