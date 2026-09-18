// this file is used to make the api calls to the backend for the tickets
import { apiFetch } from './client.js';




// POST /api/tickets — create ticket (user only)
export async function createTicket(subject, category, description, onUnauthorized) {
  return apiFetch(
    '/tickets',
    {
      method: 'POST',
      body: JSON.stringify({ subject, category, description }),
    },
    onUnauthorized
  );
}




// GET /api/tickets — list visible to current role
export async function fetchTicketsFromDb(params = {}, onUnauthorized) {
  const query = new URLSearchParams(params).toString();
  const suffix = query ? `?${query}` : '';
  return apiFetch(`/tickets${suffix}`, {}, onUnauthorized);
}




// GET /api/tickets/:ticketId
export async function fetchTicketById(ticketId, onUnauthorized) {
  return apiFetch(`/tickets/${ticketId}`, {}, onUnauthorized);
}




// PATCH /api/tickets/:ticketId — admin status / priority / category / assign
export async function updateTicketFields(ticketId, fields, onUnauthorized) {
  return apiFetch(
    `/tickets/${ticketId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(fields),
    },
    onUnauthorized
  );
}




// GET /api/tickets/:ticketId/log — admin PDF export { ticket, messages }
export async function fetchTicketLog(ticketId, onUnauthorized) {
  return apiFetch(`/tickets/${ticketId}/log`, {}, onUnauthorized);
}
