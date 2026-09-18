// this file is used to make the api calls to the backend for the authentication

import { apiFetch } from './client.js';                // to make the api calls to the backend

// the endpoints defined here needed to be the same as the ones in the backend, otherwise the api calls will not work


// POST /api/auth/login
export async function loginUser(username, password, onUnauthorized) {  
  return apiFetch(
    '/auth/login',                                                // the endpoint to the backend, we put this here but not at client.js because it is specific to the authentication api
    {
      method: 'POST',                                            // the method of the request
      body: JSON.stringify({ username, password }),                 // the body of the request
    },
    onUnauthorized                                                // onUnauthorized = handleUnauthorized function from the useAuth hook
  );
}




// GET /api/auth/me — role from database
export async function fetchCurrentUser(onUnauthorized) {
  return apiFetch('/auth/me', { method: 'GET' }, onUnauthorized);
}




// POST /api/auth/register
export async function registerUser(username, password, onUnauthorized) {
  return apiFetch(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    onUnauthorized
  );
}
