// Imports
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import UserLayout from '../../layouts/UserLayout.jsx';




// Public registration route at /register
export default function RegisterPage() {
  const { isAuthenticated, handleRegister } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);



  // happens when the user is already authenticated and redirects to the dashboard page
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // happens when the user is successfully registered and redirects to the login page
  // the state can be changed at the handleSubmit function
  if (redirectToLogin) {
    return <Navigate to="/login" replace />;
  }



  // handleSubmit function is used to submit the form and register the user
  // async syntax is used to wait for the handleRegister function to complete (at useAuth.jsx) 
  // and then store the token and user in localStorage and set the current user in the state (happens at useAuth.jsx)
  // and then navigate to the login page (happens at useAuth.jsx)
  // and then proceed to finally block to set the submitting state to false and enable the button if the form is not submitting 
  const handleSubmit = async (event) => {
    event.preventDefault();                                          // event.preventDefault() is used to prevent the default behavior of the form (which is to submit the form)
    setErrorMessage('');                                              // setErrorMessage('') is used to clear the error message if the form is not submitting 
    setSuccessMessage('');                                            // setSuccessMessage('') is used to clear the success message if the form is not submitting 

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsSubmitting(true);                                          // setIsSubmitting(true) is used to disable the button if the form is submitting 
    try { 
      await handleRegister(username, password);                           // call the handleRegister function from the useAuth.jsx file and pass the username and password to it
      setSuccessMessage('Registration successful! Redirecting to login...');
      setUsername('');                                             // setUsername('') is used to clear the username input 
      setPassword('');                                             // setPassword('') is used to clear the password input 
      setConfirmPassword('');                                      // setConfirmPassword('') is used to clear the confirm password input 

      setTimeout(() => {
        setRedirectToLogin(true);                                       // Navigate after 2s
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <UserLayout>
      <div className="auth-page auth-page--in-frame">
        <div className="auth-container auth-container--compact">
          <h1>Create Account</h1>
          <p>Join our support community</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Choose a username"
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
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              Sign Up
            </button>

            {errorMessage && <div className="form-error">{errorMessage}</div>}
            {successMessage && <div className="form-success">{successMessage}</div>}
          </form>

          <div className="auth-link-row">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
