import { apiFetch } from './client.js';

export async function fetchUsersFromDb(onUnauthorized) {
  return apiFetch('/auth/users', { method: 'GET' }, onUnauthorized);
}

export async function fetchUserById(userId, onUnauthorized) {
  return apiFetch(`/auth/users/${userId}`, { method: 'GET' }, onUnauthorized);
}

export async function createUserAccount(username, password, role, onUnauthorized) {
  return apiFetch(
    '/auth/users',
    {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    },
    onUnauthorized
  );
}

export async function updateUserAccount(userId, updates, onUnauthorized) {
  return apiFetch(
    `/auth/users/${userId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
    onUnauthorized
  );
}

export async function deleteUserAccount(userId, onUnauthorized) {
  return apiFetch(`/auth/users/${userId}`, { method: 'DELETE' }, onUnauthorized);
}
