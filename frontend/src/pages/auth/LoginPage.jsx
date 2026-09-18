// Imports
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';    
import { useAuth } from '../../hooks/useAuth.jsx';





export default function LoginPage() {
  const { isAuthenticated, handleLogin } = useAuth();                   // destructuring the useAuth hook to get the isAuthenticated and handleLogin functions, eventhough handleLogin isnt exported, it is still available because it is in the useAuth hook
  const [username, setUsername] = useState('');                       // state for the username input
  const [password, setPassword] = useState('');                       // state for the password input
  const [errorMessage, setErrorMessage] = useState('');                 // inline error below form, shows error message if login fails
  const [isSubmitting, setIsSubmitting] = useState(false);             // state for the submitting state



 // happens when the user is already authenticated and redirects to the dashboard page
  if (isAuthenticated) {                                           {/* calls the useAuth hook to check if user is authenticated */}
    return <Navigate to="/dashboard" replace />;                   {/* redirect to dashboard if user is already authenticated */}
  }



  // handleSubmit function is used to submit the form and login the user
  // async syntax is used to wait for the handleLogin function to complete (at useAuth.jsx) 
  // and then store the token and user in localStorage and set the current user in the state (happens at useAuth.jsx)
  // and then navigate to the dashboard page (happens at useAuth.jsx)
  // and then proceed to finally block to set the submitting state to false and enable the button if the form is not submitting 
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    setIsSubmitting(true);
    try {
      await handleLogin(username, password);                            // call the handleLogin function from the useAuth hook and pass the username and password to it
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);                                          // setIsSubmitting(false) is used to enable the button if the form is not submitting 
    }
  };



  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Ticketing System</h1>
        <p>Sign in to your account</p>

        <form className="auth-form" onSubmit={handleSubmit}>  
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}   // onChange is used to update the username state when the user types in the username input 
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}   // onChange is used to update the password state when the user types in the password input 
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={isSubmitting}>  {/* disabled={isSubmitting} is used to disable the button if the form is submitting */}
            Sign In
          </button>                                                                  {/* button is used to submit the form and therefore calls the handleSubmit function like defined in the form onSubmit attribute*/}

          {errorMessage && <div className="form-error">{errorMessage}</div>}   {/* errorMessage is used to display the error message if the login fails */}

          <div className="auth-link-row">
            Don&apos;t have an account? <Link to="/register">Register here</Link>   {/* link is used to navigate to the register page, which the different is it is linked to the text "Register here" */}
          </div>                                                                   {/* the div is used to display the link to the register page */}
        </form>
      </div>
    </div>
  );
}


// react state = live UI truth
// localStorage = backup storage for the user data
// we need to use both to ensure the user data is not lost if the page is refreshed