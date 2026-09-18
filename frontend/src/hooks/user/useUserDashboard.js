// Imports
import { useCallback, useMemo, useState } from 'react';
import {
  createTicket,
  fetchTicketsFromDb,
} from '../../api/ticketApi.js';
import { useAuth } from '../useAuth.jsx';
import { useToast } from '../useToast.jsx';
import { filterAndSortTickets, paginateList } from '../shared/ticketListFilters.js';




const USER_DASHBOARD_PAGE_SIZE = 8;                                     // tickets per user dashboard page




// End-user ticket list — create ticket + filters
export function useUserDashboard() {
  const { handleUnauthorized } = useAuth();
  const { showToast } = useToast();



  // List state
  const [allTickets, setAllTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);



  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('last_activity');



  // Load tickets from API (silent skips loading spinner)
  const loadTicketsFromDb = useCallback(
    async (options = {}) => {
      const { silent = false } = options;
      if (!silent) setIsLoading(true);
      try {
        const tickets = await fetchTicketsFromDb({}, handleUnauthorized);
        setAllTickets(tickets);
      } catch (error) {
        console.error('Failed to load tickets', error);
        if (!silent) showToast('Failed to load tickets', 'error');
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [handleUnauthorized, showToast]
  );



  // Client-side filter + sort
  // or u can just use normal object way to do it instead of useMemo
  const filteredTickets = useMemo(
    () =>
      filterAndSortTickets(allTickets, {
        searchTerm,
        filterStatus,
        sortOrder,
      }),
    [allTickets, searchTerm, filterStatus, sortOrder]
  );



  // Paginate filtered list
  const { totalPages, startIndex, pageItems: currentPageTickets } = useMemo(
    () => paginateList(filteredTickets, currentPage, USER_DASHBOARD_PAGE_SIZE),
    [filteredTickets, currentPage]
  );



  // Create a new ticket
  const handleCreateTicket = useCallback(
    async (subject, category, description) => {
      try {
        const newTicket = await createTicket(subject, category, description, handleUnauthorized);
        showToast('Ticket submitted successfully', 'success');
        return newTicket;
      } catch (error) {
        showToast(`Error creating ticket: ${error.message}`, 'error');
        return null;
      }
    },
    [handleUnauthorized, showToast]
  );



  return {
    isLoading,
    allTickets: filteredTickets,
    currentPageTickets,
    currentPage,
    totalPages,
    pageSize: USER_DASHBOARD_PAGE_SIZE,
    startIndex,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortOrder,
    setSortOrder,
    setCurrentPage,
    loadTicketsFromDb,
    handleCreateTicket,
  };
}


// also  useMemo isn’t what forces Context.
// useAuth uses Context because the whole app needs auth.
// useAdminDashboard returns {} because only the dashboard needs that data.