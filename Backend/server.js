// Imports
const path = require('path');                                   // built-in path helpers
const http = require('http');                                   // HTTP server (needed for Socket.io)
const express = require('express');                             // web framework
const cors = require('cors');                                   // allow cross-origin requests
const dotenv = require('dotenv');                               // load .env into process.env
const { Server } = require('socket.io');                        // real-time WebSocket layer

const authRoutes = require('./routes/authRoutes');              // /api/auth
const ticketRoutes = require('./routes/ticketRoutes');          // /api/tickets
const chatRoutes = require('./routes/chatRoutes');              // /api/chat
const { initSocket } = require('./socket/socketHandler');       // socket auth + event wiring




dotenv.config();                                                // load environment variables from .env




// Server setup
const app = express();
const server = http.createServer(app);                          // manual HTTP server so Socket.io can attach

const frontendDir = process.env.FRONTEND_DIR                    // optional override for deployed builds
    || path.join(__dirname, '..', 'frontend', 'dist');




// Global middleware
app.use(cors());                                                // enable CORS for all routes
app.use(express.json());                                        // parse JSON request bodies
app.use(express.urlencoded({ extended: true }));                // parse URL-encoded form bodies

// /uploads MUST be registered BEFORE the React static folder,
// otherwise Express would serve index.html for attachment URLs.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(frontendDir));                           // serve built React app in production




// API routes
app.use('/api/auth', authRoutes);                               // login / register / me
app.use('/api/tickets', ticketRoutes);                          // tickets + attachments + log
app.use('/api/chat', chatRoutes);                               // messages + mark read




// SPA catch-all — do NOT swallow /api or /uploads (those should 404 if missing)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return res.status(404).json({ message: 'Not found' });
    }
    res.sendFile(path.join(frontendDir, 'index.html'));         // React Router client routes
});




// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: '*',                                            // allow all origins (tighten in production if needed)
        methods: ['GET', 'POST'],
    },
});

app.set('io', io);                                              // controllers: req.app.get('io')
const onlineUsers = new Map();                                  // userId -> socketId
initSocket(io, onlineUsers);                                    // auth + room join + events




// Start server
const PORT = process.env.PORT || 5000;
const ip_address = process.env.IP_ADDRESS;

server.listen(PORT, ip_address, () => {
    console.log(`Server running on http://${ip_address || 'localhost'}:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);                                            // stop process on fatal startup failure
});
