// Imports
const jwt = require('jsonwebtoken');                            // verify Bearer tokens




// Verify Bearer JWT and attach decoded user to req.user
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];            // expected: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Token missing' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        req.user = user;                                        // decoded payload: { id, username, role }
        next();
    });
};




// Restrict route to one or more roles — authorizeRoles('admin')
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};




module.exports = {
    authenticateToken,
    authorizeRoles,
};
