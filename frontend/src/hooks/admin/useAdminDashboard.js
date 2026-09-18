// Imports
import { useCallback, useMemo, useState } from 'react';
import { fetchTicketsFromDb } from '../../api/ticketApi.js';
import { useAuth } from '../useAuth.jsx';
import { useToast } from '../useToast.jsx';
import { filterAndSortTickets, paginateList } from '../shared/ticketListFilters.js';




const DASHBOARD_PAGE_SIZE = 20;                                         // tickets per admin dashboard page, the rest is handled by the pagination component




// Admin ticket list — filters and pagination
export function useAdminDashboard() {
  const { currentUser, handleUnauthorized } = useAuth();           // destructuring the currentUser and handleUnauthorized function from the useAuth hook
  const { showToast } = useToast();                               // destructuring the showToast function from the useToast hook



  // List state
  const [allTickets, setAllTickets] = useState([]);                  // allTickets is an array of all the tickets in the database
  const [isLoading, setIsLoading] = useState(true);                  // isLoading is a boolean that is true when the tickets are loading
  const [currentPage, setCurrentPage] = useState(1);                  // currentPage is a number that is the current page of the tickets



  // Filters, since it can be changed by the user, we need to store the state in the hook
  const [searchTerm, setSearchTerm] = useState('');                    // searchTerm is a string that is the search term for the tickets
  const [filterCategory, setFilterCategory] = useState('');            // filterCategory is a string that is the filter category for the tickets
  const [filterStatus, setFilterStatus] = useState('');                // filterStatus is a string that is the filter status for the tickets 
  const [filterPriority, setFilterPriority] = useState('');            // filterPriority is a string that is the filter priority for the tickets
  const [sortOrder, setSortOrder] = useState('last_activity');         // sortOrder is a string that is the sort order for the tickets
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);  // filterAssignedToMe is a boolean that is true when the tickets are assigned to the current user



  // Load tickets from API (silent skips loading spinner)
  const loadTicketsFromDb = useCallback(
    async (options = {}) => {                                    // options is an object that contains the options for the tickets
      const { silent = false } = options;                         // silent is a boolean that is true when the loading spinner is not shown
      if (!silent) setIsLoading(true);                             // if the loading spinner is not shown, set the loading spinner to true
      try {
        const tickets = await fetchTicketsFromDb({}, handleUnauthorized);    //  from ticketApi.js, fetch the tickets from the database
        setAllTickets(tickets);
      } catch (error) {
        console.error('Failed to load tickets', error);
        if (!silent) showToast('Failed to load tickets', 'error');
      } finally {
        if (!silent) setIsLoading(false);                           // if the loading spinner is not shown, set the loading spinner to false, so the loading spinner is not shown anymore
      }
    },
    [handleUnauthorized, showToast]                              // dependencies for the useCallback hook, so it re-runs when the handleUnauthorized or showToast function changes
  );



  // Client-side filter + sort
  // the data is filtered and sorted in the client side using the filterAndSortTickets function from the ticketListFilters.js file
  // useMemo is a hook that memoizes the filtered tickets, so it does not re-run unnecessarily
  // or u can just use normal object way to do it instead of useMemo
  const filteredTickets = useMemo(
    () =>
      filterAndSortTickets(allTickets, {                                   // filterAndSortTickets is a function that filters and sorts the tickets
        searchTerm,
        filterCategory,
        filterStatus,
        filterPriority,
        sortOrder,
        filterAssignedToMe,
        assignedAdminId: currentUser?.id,                             // assignedAdminId is the id of the admin that is assigned to the tickets
      }),
    [
      allTickets,                                                  // these one are also memoized, so they do not re-run unnecessarily, but they are not used in the filterAndSortTickets function because they are static and never change
      searchTerm,
      filterCategory,
      filterStatus,
      filterPriority,
      sortOrder,
      filterAssignedToMe,
      currentUser?.id,
    ]
  );



  // Paginate filtered list
  const { totalPages, startIndex, pageItems: currentPageTickets } = useMemo(
    () => paginateList(filteredTickets, currentPage, DASHBOARD_PAGE_SIZE),
    [filteredTickets, currentPage]
  );



  return {
    isLoading,
    allTickets: filteredTickets,
    currentPageTickets,
    currentPage,
    totalPages,
    pageSize: DASHBOARD_PAGE_SIZE,
    startIndex,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    sortOrder,
    setSortOrder,
    filterAssignedToMe,
    setFilterAssignedToMe,
    setCurrentPage,
    loadTicketsFromDb,
  };
}


// also  useMemo isn’t what forces Context.
// useAuth uses Context because the whole app needs auth.
// useAdminDashboard returns {} because only the dashboard needs that data.