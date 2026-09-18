// Shared client-side filter + sort + pagination for ticket lists




// Filter by search/category/status/priority/assignee, then sort
export function filterAndSortTickets(
  tickets,
  {
    searchTerm = '',
    filterCategory = '',
    filterStatus = '',
    filterPriority = '',
    sortOrder = 'last_activity',
    filterAssignedToMe = false,
    assignedAdminId = null,
  }
) {
  const normalizedSearch = searchTerm.toLowerCase();

  let result = tickets.filter((ticket) => {
    if (
      normalizedSearch &&
      !ticket.subject.toLowerCase().includes(normalizedSearch) &&
      !ticket.ticket_number.toLowerCase().includes(normalizedSearch)
    ) {
      return false;
    }
    if (filterCategory && ticket.category !== filterCategory) return false;
    if (filterStatus && ticket.status !== filterStatus) return false;
    if (filterPriority && ticket.priority !== filterPriority) return false;
    if (
      filterAssignedToMe &&
      Number(ticket.assigned_admin_id) !== Number(assignedAdminId)
    ) {
      return false;
    }
    return true;
  });

  result = [...result].sort((ticketA, ticketB) => {
    const timeA = new Date(ticketA.last_message_time || ticketA.created_at).getTime();
    const timeB = new Date(ticketB.last_message_time || ticketB.created_at).getTime();
    const createA = new Date(ticketA.created_at).getTime();
    const createB = new Date(ticketB.created_at).getTime();
    if (sortOrder === 'newest') return createB - createA;
    return timeB - timeA;                                               // default: last activity
  });

  return result;
}




// Slice a list into a page window
export function paginateList(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  return {
    totalPages,
    safePage,
    startIndex,
    pageItems: items.slice(startIndex, startIndex + pageSize),
  };
}
