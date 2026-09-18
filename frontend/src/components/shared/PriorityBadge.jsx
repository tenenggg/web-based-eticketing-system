// Imports
import { getPriorityClassName } from '../../utils/formatters.js';




// Coloured pill showing ticket priority
export default function PriorityBadge({ priority }) {
  return (
    <span className={`ticket-badge ${getPriorityClassName(priority)}`}>
      {priority}
    </span>
  );
}
