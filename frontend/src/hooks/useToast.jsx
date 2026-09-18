// the same concept with useAuth.jsx, but for the toast component
// still use useContext to get the context value for the ToastContext in the components that need it
// and also use useMemo to memoize the context value so it is not re-rendered unnecessarily

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';




// is a shared context for the entire application, if no provider is found, useToast will throw an error
const ToastContext = createContext(null);

const TOAST_DURATION_MS = 3000;                                         // auto-hide after 3 seconds




// Provider — shared showToast(message, type) for all pages
export function ToastProvider({ children }) {
  const [toastMessage, setToastMessage] = useState('');                 // empty string = hidden
  const [toastType, setToastType] = useState('info');                   // 'success' | 'error' | 'info'



  // Show a toast — type defaults to 'info'
  const showToast = useCallback((message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
  }, []);



  // Auto-dismiss after TOAST_DURATION_MS
  useEffect(() => {
    if (!toastMessage) return undefined;

    const timer = setTimeout(() => {
      setToastMessage('');                                              // clearing message hides the toast
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);                                   // cleanup if a new toast fires early
  }, [toastMessage]);



  const contextValue = useMemo(
    () => ({ toastMessage, toastType, showToast }),
    [toastMessage, toastType, showToast]
  );

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
}




// Hook — read toast state / showToast from any component
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
