// Imports
import { StrictMode } from 'react';                                      // highlights unsafe side effects in dev
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';                                                   // shared / admin styles
import './styles/user-portable.css';                                    // 320px user frame styles




// Mount React app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);



// you can also put the browser router here instead of in App.jsx, but then you can't use useNavigate() in App.jsx itself, 
// but you can use it in any child component of App.jsx. So it's a matter of preference. 
// I prefer to put it in App.jsx so that I can use useNavigate() in App.jsx itself, but you can put it here if you want to.