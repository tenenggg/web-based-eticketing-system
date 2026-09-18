  // App.jsx - which its job is basically like setting the URL to a Component and let React Router change what 
  // supposed to be rendered on the screen

  import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

  import ProtectedRoute from './components/shared/ProtectedRoute.jsx';
  import Toast from './components/shared/Toast.jsx';
  import { AuthProvider } from './hooks/useAuth.jsx';
  import { ToastProvider } from './hooks/useToast.jsx';

  import LoginPage from './pages/auth/LoginPage.jsx';
  import RegisterPage from './pages/auth/RegisterPage.jsx';
  import RoleDashboard from './routing/RoleDashboard.jsx';                // admin vs user shell
  import RoleWorkspace from './routing/RoleWorkspace.jsx';




  export default function App() {
    return (
      <BrowserRouter>                                                       {/* enable the whole app inside to work with routing  like  useNavigate, route, Routes, useParams and etc */}
        <ToastProvider>                                                      {/* holds the data, actions, and state for the toast component(notifications) */}
          <AuthProvider>                                                    {/* so that the whole app can use it, but useContext allows  app to fill the context value  and read it*/}
            <Toast />                                                       {/* reads the toast data, actions, and state from the ToastProvider and displays the toast messages */}

            <Routes>                                                          {/* route definition and rendering , at runtime router checks current url and chooses the matching route to render */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route                                                         // protected route, only authenticated users can access the dashboard, this is actually one line
                path="/dashboard"                                            // but we want to show the dashboard based on the role of the user, so we need to pass the role to the dashboard component
                element={
                  <ProtectedRoute>                                          {/* Router detects the url become dashboard and calls the ProtectedRoute component to check if the user is authenticated and has the required role to access the dashboard */}
                    <RoleDashboard />                                        {/* RoleDashboard component is rendered if the user is authenticated and has the required role to access the dashboard */}
                  </ProtectedRoute> 
                }
              />

              <Route                                                    // protected route, only authenticated users can access the workspace 
                path="/workspace/:ticketId?"
                element={
                  <ProtectedRoute> 
                    <RoleWorkspace /> 
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/login" replace />} /> {/* if the user tries to access a route that doesn't exist, redirect to the login page */}
            </Routes>                                                       
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    );
  }


  // the orders of routes doesnt matter cause react router checks all routes and finds the matching one, based on path (what user types in url bar or clicks on the link)
  // so it rendered when the path matches the route

  // but it matters when there are nested routes, which involves like parent, child, like /workspace/settings
  // so the nested routes will be rendered when the path matches the route
  // and the parent route will be rendered when the path matches the route
  // and the grandparent route will be rendered when the path matches the route
  // and so on

  // but for your project, the routes are not nested, so it doesn't matter, only outside the routes are nested