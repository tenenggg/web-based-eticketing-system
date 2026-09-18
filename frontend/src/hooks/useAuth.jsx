  // Imports
  import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
  import { useNavigate } from 'react-router-dom';                          
  import { fetchCurrentUser, loginUser, registerUser } from '../api/authApi.js';  // to check the user's role and username from the database and to login and register the user




  // a shared context for the entire application, if no provider is found, useAuth will throw an error
  // is used to store the current user and the authentication status
  // createContext is a way to pass data through the component tree without having to pass props down through each level (context api)
  // often paired with useContext to get the context value for the AuthContext in the components that need it
  const AuthContext = createContext(null);




  // Read localStorage key "user" (restore session on refresh so user is not logged out)
  // if no user is found, return null(logged out)
  function readStoredUser() {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }




  // Provider — wraps app so any component can call useAuth(), is called in LoginPage.jsx
  export function AuthProvider({ children }) {
    const navigate = useNavigate();                                       // used to go to different routes
    const [currentUser, setCurrentUser] = useState(readStoredUser);       // call readStoredUser function and store the result in the currentUser state



    // is called when the user is unauthorized (apiFetch 401/403), many function pass it to api calls, to make sure the user is logged out and the page is refreshed
    // useCallback is used to prevent unnecessary re-renders, tldr: if the function is not a dependency of the component, it will not be re-rendered
    const handleUnauthorized = useCallback(() => {               
      localStorage.removeItem('token');                           // remove the token from localStorage
      localStorage.removeItem('user');                            // remove the user from localStorage
      setCurrentUser(null);                                      // set the current user to null
      navigate('/login');                                        // navigate to the login page
    }, [navigate]);                                             // navigate to the login page when the user is unauthorized



    // On refresh, sync role/username from DB so UI matches users.role
    useEffect(() => {
      const token = localStorage.getItem('token');                  // get the token from localStorage
      if (!token) return undefined;                                // if no token is found, return undefined

      let cancelled = false;                                     

      fetchCurrentUser(handleUnauthorized)                         // call the fetchCurrentUser function from the authApi.js file and pass the handleUnauthorized function to it
        .then((data) => {
          if (cancelled || !data?.user) return;                      // if the request is cancelled or no user is found, return
          localStorage.setItem('user', JSON.stringify(data.user));   // store the user in localStorage
          setCurrentUser(data.user);                                 // set the current user in the state
        })
        .catch(() => {
          /* handleUnauthorized already runs on 401/403 via apiFetch */
        });

      return () => {                                            // return a function to cancel the request so it does not continue after the component is unmounted (happens when the user navigates to a different page)(cleanup function)
        cancelled = true;
      };
    }, [handleUnauthorized]);                                      // handleUnauthorized is passed to the fetchCurrentUser function so it is called when the user is unauthorized and will not continue after the component is unmounted



    // called in LoginPage.jsx to login the user, and receives username and password from the LoginPage component
    // we use async/await to wait for the loginUser function to complete (at authApi.js) and then store the token 
    // and user in localStorage and set the current user in the state and navigate to the dashboard page
    // if we dont use async/await, the code will execute before the loginUser function completes, and the user will not be logged in because the token and user are not stored in localStorage
    const handleLogin = useCallback(
      async (username, password) => {                                          // receives username and password from the LoginPage component
        const data = await loginUser(username, password, handleUnauthorized); // call the loginUser function from the authApi.js file and pass the username and password to it and the handleUnauthorized function to it                  
        localStorage.setItem('token', data.token);                            // store the token in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));              // store the user in localStorage
        setCurrentUser(data.user);                                              // set the current user in the state
        navigate('/dashboard');                                                  // navigate to the dashboard page
      },
      [handleUnauthorized, navigate]                                   // handleUnauthorized and navigate are passed to the loginUser function so it is called when the user is unauthorized and will not continue after the component is unmounted and the user is logged in
    );



    // called in RegisterPage.jsx to register the user, and receives username and password from the RegisterPage component  
    // we use async/await to wait for the registerUser function to complete (at authApi.js) and then return the result
    const handleRegister = useCallback(
      async (username, password) => {                                          // receives username and password from the RegisterPage component
        return registerUser(username, password, handleUnauthorized);          // call the registerUser function from the authApi.js file and pass the username and password to it and the handleUnauthorized function to it
      },
      [handleUnauthorized]                                                    // handleUnauthorized is passed to the registerUser function so it is called when the user is unauthorized and will not continue after the component is unmounted
    );



    // Clears storage and navigates to login, no api call is made
    const handleLogout = useCallback(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
      navigate('/login');
    }, [navigate]);



    // useMemo is used to memoize the context value, tldr: if the context value is not changed, it will not be re-rendered
    // we use useMemo to memoize the context value so it is not re-rendered unnecessarily
    // this is useful because it prevents unnecessary re-renders of the components that use the context value
    // and again we assign the DATA/VALUE not the function to the context value so it is not re-rendered unnecessarily

    // if we dont use useMemo, the standard way to do it would be:
    // const contextValue = {
    //   currentUser,
    //   isAuthenticated: Boolean(currentUser),
    //   isAdmin: currentUser?.role === 'admin',
    //   handleLogin,
    //   handleRegister,
    //   handleLogout,
    //   handleUnauthorized,
    // };
    // which is the normal object way to do it
    const contextValue = useMemo(           
      () => ({
        currentUser,                                                      // null when logged out
        isAuthenticated: Boolean(currentUser),                            // shorthand for route guards
        isAdmin: currentUser?.role === 'admin',                           // role check on dashboard + workspace
        handleLogin,
        handleRegister,
        handleLogout,
        handleUnauthorized,                                               // passed to every API call in hooks
      }),
      [currentUser, handleLogin, handleRegister, handleLogout, handleUnauthorized]  
    );

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;        // wrap the children component in the AuthContext.Provider component with the context value, so that it can be used and called by the components that need it
  }




  // useContext is a hook that returns the context value for the current context, tldr: if the context is not found, throw an error
  // we use useContext to get the context value for the AuthContext in the components that need it
  // export are needed to export the function to the components that need it
  // if we dont export the function,other files will not be able to use it
  export function useAuth() {
    const context = useContext(AuthContext);                                   // useContext is a hook that returns the context value for the current context (which is the AuthContext and is the whole AuthProvider component)
    if (!context) {
      throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
  }



  // tldr useMemo and useCallback are used to prevent unnecessary re-renders and improve performance
  // it make the code cache a value/function reuse the same reference instead of running and recalculating it every time
  // without it, AuthProvider will re-render every time the component is rendered, and the context value will be recalculated every time
  
  //  the difference between useMemo and useCallback is that useMemo is used to memoize a value, and useCallback is used to memoize a function
  // useMemo: runs the function you give it, caches the returned value (object, array, number, string — whatever computeValue produces).
  // useCallback: does not run the function — it just caches the function reference itself, so you get the same function back across renders instead of a freshly-created one.
  // memoize = cache a value/function reuse the same reference instead of running and recalculating it every time



  // also  useMemo isn’t what forces Context.
  // useAuth uses Context because the whole app needs auth.
  // useAdminDashboard returns {} because only the dashboard needs that data.


