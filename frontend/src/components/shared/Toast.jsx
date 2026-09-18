// Imports
import { useToast } from '../../hooks/useToast.jsx';




// Fixed bottom notification bar
export default function Toast() {
  const { toastMessage, toastType } = useToast();                       // empty message = hidden

  return (
    <div
      className={`toast ${toastMessage ? 'show' : ''} toast-${toastType}`}
      role="status"
      aria-live="polite"
    >
      {toastMessage}
    </div>
  );
}
