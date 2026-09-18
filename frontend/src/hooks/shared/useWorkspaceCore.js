// Imports
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchMessagesForTicket,
  markTicketAsReadInDb,
  uploadAttachment,
} from '../../api/chatApi.js';
import {
  fetchTicketById,
  fetchTicketsFromDb,
  updateTicketFields,
} from '../../api/ticketApi.js';
import { useAuth } from '../useAuth.jsx';
import { useSocket } from '../useSocket.js';
import { useToast } from '../useToast.jsx';




const SIDEBAR_PAGE_SIZE = 20;                                           // tickets per sidebar page




// Shared workspace state — tickets sidebar, chat, sockets
// Admin/user pass messageEmitMode: 'admin_reply' | 'send_message'
export function useWorkspaceCore(activeTicketIdFromRoute, { messageEmitMode }) {
  const navigate = useNavigate();
  const { currentUser, handleUnauthorized } = useAuth();
  const { showToast } = useToast();
  const { socket, getSocket, joinTicketRoom, leaveTicketRoom } = useSocket();
  const previousTicketIdRef = useRef(null);



  // Ticket + chat state
  const [allTickets, setAllTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(activeTicketIdFromRoute || null);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sidebarCurrentPage, setSidebarCurrentPage] = useState(1);



  // Sidebar filters
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
  const [sidebarSortOrder, setSidebarSortOrder] = useState('activity');
  const [sidebarFilterPriority, setSidebarFilterPriority] = useState('');
  const [sidebarFilterType, setSidebarFilterType] = useState('');



  // Sync active ticket from route param
  useEffect(() => {
    if (activeTicketIdFromRoute) {
      setActiveTicketId(activeTicketIdFromRoute);
    }
  }, [activeTicketIdFromRoute]);



  // Join/leave socket room when active ticket changes
  useEffect(() => {
    if (!socket || !activeTicketId) return undefined;
    joinTicketRoom(activeTicketId);
    return () => leaveTicketRoom(activeTicketId);
  }, [socket, activeTicketId, joinTicketRoom, leaveTicketRoom]);



  // Load all tickets for sidebar
  const loadSidebarTicketsFromDb = useCallback(async () => {
    try {
      const tickets = await fetchTicketsFromDb({}, handleUnauthorized);
      setAllTickets(tickets);
    } catch (error) {
      console.error('Failed to load tickets', error);
    }
  }, [handleUnauthorized]);



  // Client-side filter + sort for sidebar list
  const filteredSidebarTickets = useMemo(() => {
    const normalizedSearch = sidebarSearchTerm.toLowerCase();

    let result = allTickets.filter((ticket) => {
      if (
        normalizedSearch &&
        !ticket.subject.toLowerCase().includes(normalizedSearch) &&
        !ticket.ticket_number.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }
      if (sidebarFilterPriority && ticket.priority !== sidebarFilterPriority) return false;
      if (sidebarFilterType && ticket.category !== sidebarFilterType) return false;
      return true;
    });

    result = [...result].sort((ticketA, ticketB) => {
      const timeA = new Date(ticketA.last_message_time || ticketA.created_at).getTime();
      const timeB = new Date(ticketB.last_message_time || ticketB.created_at).getTime();
      const createA = new Date(ticketA.created_at).getTime();
      const createB = new Date(ticketB.created_at).getTime();
      return sidebarSortOrder === 'newest' ? createB - createA : timeB - timeA;
    });

    return result;
  }, [allTickets, sidebarSearchTerm, sidebarSortOrder, sidebarFilterPriority, sidebarFilterType]);



  // Sidebar pagination
  const sidebarTotalPages = Math.max(
    1,
    Math.ceil(filteredSidebarTickets.length / SIDEBAR_PAGE_SIZE)
  );

  const sidebarPageTickets = useMemo(() => {
    const safePage = Math.min(sidebarCurrentPage, sidebarTotalPages);
    const startIndex = (safePage - 1) * SIDEBAR_PAGE_SIZE;
    return filteredSidebarTickets.slice(startIndex, startIndex + SIDEBAR_PAGE_SIZE);
  }, [filteredSidebarTickets, sidebarCurrentPage, sidebarTotalPages]);



  // Open a ticket: join room, load details + messages, mark read
  const openTicketById = useCallback(
    async (ticketId) => {
      const normalizedTicketId = String(ticketId);

      if (previousTicketIdRef.current && previousTicketIdRef.current !== normalizedTicketId) {
        leaveTicketRoom(previousTicketIdRef.current);
      }

      previousTicketIdRef.current = normalizedTicketId;
      setActiveTicketId(normalizedTicketId);
      joinTicketRoom(normalizedTicketId);

      if (String(activeTicketIdFromRoute) !== normalizedTicketId) {
        navigate(`/workspace/${normalizedTicketId}`, { replace: true });
      }

      try {
        const [ticket, ticketMessages] = await Promise.all([
          fetchTicketById(normalizedTicketId, handleUnauthorized),
          fetchMessagesForTicket(normalizedTicketId, handleUnauthorized),
        ]);

        await markTicketAsReadInDb(normalizedTicketId, handleUnauthorized);

        setCurrentTicket(ticket);
        setMessages(ticketMessages);
      } catch (error) {
        console.error('Error opening ticket', error);
        showToast('Failed to load ticket details', 'error');
      }
    },
    [
      activeTicketIdFromRoute,
      leaveTicketRoom,
      joinTicketRoom,
      navigate,
      handleUnauthorized,
      showToast,
    ]
  );



  // Patch fields on the active ticket
  const handleUpdateActiveTicket = useCallback(
    async (updates) => {
      if (!activeTicketId) return;
      try {
        const updatedTicket = await updateTicketFields(activeTicketId, updates, handleUnauthorized);
        const refreshedMessages = await fetchMessagesForTicket(activeTicketId, handleUnauthorized);
        setCurrentTicket(updatedTicket);
        setMessages(refreshedMessages);
        await loadSidebarTicketsFromDb();
      } catch (error) {
        showToast('Failed to update ticket', 'error');
      }
    },
    [activeTicketId, handleUnauthorized, loadSidebarTicketsFromDb, showToast]
  );



  // Emit chat message (admin_reply or send_message)
  const handleSendMessage = useCallback(
    (content, options = {}) => {
      const activeSocket = getSocket() || socket;
      if (!activeSocket || !activeTicketId || !content.trim()) return;

      if (messageEmitMode === 'admin_reply') {
        activeSocket.emit('admin_reply', {
          ticketId: activeTicketId,
          content: content.trim(),
          replyType: options.replyType || 'question',
        });
      } else {
        activeSocket.emit('send_message', { ticketId: activeTicketId, content: content.trim() });
      }
    },
    [getSocket, socket, activeTicketId, messageEmitMode]
  );



  // User: Solved / Not solved after an admin solution prompt
  const handleResolutionFeedback = useCallback(
    (resolved) => {
      const activeSocket = getSocket() || socket;
      if (!activeSocket || !activeTicketId || messageEmitMode !== 'send_message') return;

      activeSocket.emit('resolution_feedback', {
        ticketId: activeTicketId,
        resolved: Boolean(resolved),
      });
    },
    [getSocket, socket, activeTicketId, messageEmitMode]
  );



  // Admin: update ticket fields + send response in one submit
  const handleAdminSubmit = useCallback(
    async ({ category, status, priority, responseText, replyType }) => {
      if (!activeTicketId || messageEmitMode !== 'admin_reply') return;
      try {
        await updateTicketFields(
          activeTicketId,
          { category, status, priority },
          handleUnauthorized
        );
        handleSendMessage(responseText, { replyType });
        await new Promise((resolve) => setTimeout(resolve, 350));
        const [updatedTicket, refreshedMessages] = await Promise.all([
          fetchTicketById(activeTicketId, handleUnauthorized),
          fetchMessagesForTicket(activeTicketId, handleUnauthorized),
        ]);
        setCurrentTicket(updatedTicket);
        setMessages(refreshedMessages);
        await loadSidebarTicketsFromDb();
        showToast('Response submitted', 'success');
      } catch (error) {
        showToast('Failed to submit response', 'error');
      }
    },
    [
      activeTicketId,
      messageEmitMode,
      handleUnauthorized,
      handleSendMessage,
      loadSidebarTicketsFromDb,
      showToast,
    ]
  );



  // Upload attachment then refresh messages
  const handleSendAttachment = useCallback(
    async (file, caption = '') => {
      if (!activeTicketId) return;
      try {
        await uploadAttachment(activeTicketId, file, handleUnauthorized, caption);
        const refreshed = await fetchMessagesForTicket(activeTicketId, handleUnauthorized);
        setMessages(refreshed);
        await loadSidebarTicketsFromDb();
        showToast('Message sent', 'success');
      } catch (err) {
        console.error('Attachment upload failed:', err);
        showToast(err.message || 'Failed to send message', 'error');
      }
    },
    [activeTicketId, handleUnauthorized, loadSidebarTicketsFromDb, showToast]
  );



  // Socket listeners — live chat + ticket updates
  useEffect(() => {
    if (!socket) return undefined;

    const handleReceiveMessage = async (message) => {
      if (Number(message.ticket_id) === Number(activeTicketId)) {
        if (message.sender_id !== currentUser?.id) {
          await markTicketAsReadInDb(activeTicketId, handleUnauthorized);
        }
        const refreshed = await fetchMessagesForTicket(activeTicketId, handleUnauthorized);
        setMessages(refreshed);
      }
      loadSidebarTicketsFromDb();
    };

    const handleMessageDeleted = async () => {
      if (activeTicketId) {
        const refreshed = await fetchMessagesForTicket(activeTicketId, handleUnauthorized);
        setMessages(refreshed);
      }
      loadSidebarTicketsFromDb();
    };

    const handleTicketUpdated = async (ticket) => {
      if (Number(ticket.id) === Number(activeTicketId)) {
        setCurrentTicket(ticket);
        const refreshed = await fetchMessagesForTicket(activeTicketId, handleUnauthorized);
        setMessages(refreshed);
      }
      loadSidebarTicketsFromDb();
    };

    const handleTicketDeleted = (payload) => {
      const deletedId = Number(payload?.id);
      if (Number(activeTicketId) === deletedId) {
        showToast('This ticket was deleted', 'error');
        navigate('/dashboard');
        return;
      }
      loadSidebarTicketsFromDb();
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('ticket_updated', handleTicketUpdated);
    socket.on('ticket_deleted', handleTicketDeleted);

    const handleMessageError = (payload) => {
      if (payload?.error) showToast(payload.error, 'error');
    };
    socket.on('message_error', handleMessageError);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('ticket_updated', handleTicketUpdated);
      socket.off('ticket_deleted', handleTicketDeleted);
      socket.off('message_error', handleMessageError);
    };
  }, [
    socket,
    activeTicketId,
    currentUser?.id,
    handleUnauthorized,
    loadSidebarTicketsFromDb,
    navigate,
    showToast,
  ]);



  // Initial sidebar load
  useEffect(() => {
    loadSidebarTicketsFromDb();
  }, [loadSidebarTicketsFromDb]);



  return {
    currentUser,
    allTickets: filteredSidebarTickets,
    sidebarPageTickets,
    sidebarCurrentPage,
    sidebarTotalPages,
    setSidebarCurrentPage,
    sidebarSearchTerm,
    setSidebarSearchTerm,
    sidebarSortOrder,
    setSidebarSortOrder,
    sidebarFilterPriority,
    setSidebarFilterPriority,
    sidebarFilterType,
    setSidebarFilterType,
    activeTicketId,
    currentTicket,
    messages,
    openTicketById,
    handleUpdateActiveTicket,
    handleSendMessage,
    handleAdminSubmit,
    handleSendAttachment,
    handleResolutionFeedback,
  };
}
