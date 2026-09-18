// Shared HTTP client for all REST calls
// is the general client that is used to make all the api calls to the backend
// other api files like authApi.js will use this client to make the api calls to the backend

export const API_BASE = '/api';                                          // must be the same as the one in the backend, otherwise the api calls will not work




// JSON + Bearer headers when a JWT exists in localStorage, 
// this is used to authenticate the user by adding the token to the headers of the request
export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}




// Central fetch — auth headers, JSON parse, auto-logout on 401/403
// async syntax is used to wait for the fetch to complete and then return the data, and then handle the response
export async function apiFetch(endpoint, options = {}, onUnauthorized = null) {   // endpoint = /auth/login or other endpoints from authApi.js, options = method and body of the request, onUnauthorized = handleUnauthorized function from the useAuth hook
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,                                                                  // the options of the request
    headers: {
      ...getAuthHeaders(),                                                      // the headers of the request
      ...options.headers,                                                       // the headers of the request
    },
  });                                                                     

  const data = await response.json();                                         // parse the response to data in json format

  if (!response.ok) {                                                                  // if the response is not ok, throw an error
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');                                            // remove the token from localStorage
      localStorage.removeItem('user');                                            // remove the user from localStorage
      if (onUnauthorized) onUnauthorized();                                      // call the handleUnauthorized function from the useAuth hook
    }
    throw new Error(data.message || 'API Error');                                 // throw an error with the message from the response or 'API Error'
  }

  return data;                                                                   // return the data
}
