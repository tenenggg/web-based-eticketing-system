// Imports
import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';                                   // Socket.io client
import { useAuth } from './useAuth.jsx';




// Backend URL for socket (Vite proxies /api but socket needs direct connection)
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005';




// Socket connection — JWT in handshake, join/leave ticket rooms
export function useSocket() {
  const { handleUnauthorized } = useAuth();
  const socketRef = useRef(null);                                       // persists across renders
  const [socket, setSocket] = useState(null);



  // Connect once on mount when a token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token },                                                  // backend verifies JWT
    });

    setSocket(socket);
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      if (error.message.includes('Unauthorized') || error.message.includes('jwt')) {
        handleUnauthorized();                                           // expired token — force re-login
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();                                              // cleanup on unmount
      socketRef.current = null;
      setSocket(null);
    };
  }, [handleUnauthorized]);



  // Join ticket_{id} room for scoped receive_message events
  const joinTicketRoom = useCallback((ticketId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_ticket', { ticketId });
    }
  }, []);



  // Leave room when switching tickets
  const leaveTicketRoom = useCallback((ticketId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_ticket', { ticketId });
    }
  }, []);



  // Raw socket for .on() listeners — null until connected
  const getSocket = useCallback(() => socketRef.current, []);

  return { socket, getSocket, joinTicketRoom, leaveTicketRoom };
}
