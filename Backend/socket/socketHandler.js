// Imports
const jwt = require('jsonwebtoken');                            // socket handshake auth
const {
    handleUserMessage,
    handleAdminReply,
    handleResolutionFeedback,
} = require('./socketController'); // chat event handlers




// Socket JWT check — runs before connection is fully accepted
const socketAuthMiddleware = (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error: Invalid token'));
        socket.user = decoded;                                  // { id, username, role }
        next();
    });
};




// Wire events for one connected client
const registerSocketEvents = (socket, io, onlineUsers) => {
    console.log(`User connected: ${socket.user.username} (${socket.user.id})`);
    onlineUsers.set(socket.user.id, socket.id);

    if (socket.user.role === 'admin') {
        socket.join('admins');                                  // admin list / all ticket events
    } else {
        socket.join(`user_${socket.user.id}`);                  // user dashboard live updates
    }




    // Join a ticket room (workspace open)
    socket.on('join_ticket', ({ ticketId }) => {
        const room = `ticket_${ticketId}`;
        socket.join(room);
        console.log(`${socket.user.username} joined room: ${room}`);
    });




    // Leave a ticket room (navigating away)
    socket.on('leave_ticket', ({ ticketId }) => {
        const room = `ticket_${ticketId}`;
        socket.leave(room);
        console.log(`${socket.user.username} left room: ${room}`);
    });




    // User answer in thread
    socket.on('send_message', (data) => handleUserMessage(socket, io, data));




    // Admin question / solution
    socket.on('admin_reply', (data) => handleAdminReply(socket, io, onlineUsers, data));




    // User confirms solved / not solved after a solution
    socket.on('resolution_feedback', (data) => handleResolutionFeedback(socket, io, data));




    // Cleanup
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.username}`);
        onlineUsers.delete(socket.user.id);
    });
};




// Called once from server.js
const initSocket = (io, onlineUsers) => {
    io.use(socketAuthMiddleware);
    io.on('connection', (socket) => registerSocketEvents(socket, io, onlineUsers));
};




module.exports = { initSocket };
