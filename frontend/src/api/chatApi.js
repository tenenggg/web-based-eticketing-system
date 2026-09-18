// is used to make the api calls to the backend for the chat

import { API_BASE, apiFetch } from './client.js';




// GET /api/chat/tickets/:ticketId/messages
export async function fetchMessagesForTicket(ticketId, onUnauthorized) {
  return apiFetch(`/chat/tickets/${ticketId}/messages`, {}, onUnauthorized);
}




// POST /api/chat/tickets/:ticketId/read
export async function markTicketAsReadInDb(ticketId, onUnauthorized) {
  return apiFetch(`/chat/tickets/${ticketId}/read`, { method: 'POST' }, onUnauthorized);
}




// POST /api/tickets/:ticketId/attachments — multipart (cannot use apiFetch Content-Type)
export async function uploadAttachment(ticketId, file, onUnauthorized, caption = '') {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  if (caption && String(caption).trim()) {
    formData.append('caption', String(caption).trim());                 // text + file in one message
  }

  const res = await fetch(`${API_BASE}/tickets/${ticketId}/attachments`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (res.status === 401 && onUnauthorized) {
    onUnauthorized();
    return null;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(err.message || 'Upload failed');
  }

  return res.json();
}
