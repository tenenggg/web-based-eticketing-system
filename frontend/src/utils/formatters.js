// Display helpers — timestamps + badge CSS class names

// Today → time only | older → short date + time
export function formatTimestamp(dateString) {
  const messageDate = new Date(dateString);
  if (Number.isNaN(messageDate.getTime())) return '';

  const now = new Date();
  const isToday = messageDate.toDateString() === now.toDateString();

  if (isToday) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    `${messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ` +
    messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}




// Status string → CSS class for StatusBadge
export function getStatusClassName(status) {
  const statusMap = {
    Open: 'status-open',
    'In Progress': 'status-inprogress',
    'On-Hold': 'status-onhold',
    Closed: 'status-closed',
  };
  return statusMap[status] || 'status-open';
}




// Priority string → CSS class for PriorityBadge
export function getPriorityClassName(priority) {
  const priorityMap = {
    Low: 'priority-low',
    Medium: 'priority-medium',
    High: 'priority-high',
    Urgent: 'priority-urgent',
  };
  return priorityMap[priority] || 'priority-medium';
}
