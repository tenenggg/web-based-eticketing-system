// Imports
import { getStatusClassName } from '../../utils/formatters.js';




// Coloured pill showing ticket status
export default function StatusBadge({ status }) {
  return (
    <span className={`ticket-badge ${getStatusClassName(status)}`}>
      {status}
    </span>
  );
}
