// Imports
import { useEffect, useRef } from 'react';
import { useSocket } from '../useSocket.js';




// Keep dashboard ticket lists in sync via Socket.io (silent refetch)
export function useRealtimeTicketList(refetchTickets, { enabled = true } = {}) {
  const refetchRef = useRef(refetchTickets);
  refetchRef.current = refetchTickets;                                  // always call latest refetch

  const { socket } = useSocket();



  // Subscribe to ticket events — silent refresh (no loading spinner)
  useEffect(() => {
    if (!enabled || !socket) return undefined;

    const silentRefresh = () => {
      refetchRef.current?.({ silent: true });
    };

    socket.on('receive_message', silentRefresh);
    socket.on('ticket_updated', silentRefresh);
    socket.on('ticket_created', silentRefresh);

    return () => {
      socket.off('receive_message', silentRefresh);
      socket.off('ticket_updated', silentRefresh);
      socket.off('ticket_created', silentRefresh);
    };
  }, [enabled, socket]);
}
