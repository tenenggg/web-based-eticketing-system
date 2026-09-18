// Imports
import { useWorkspaceCore } from '../shared/useWorkspaceCore.js';




// Admin workspace — replies via admin_reply socket event
export function useAdminWorkspace(activeTicketIdFromRoute) {
  return useWorkspaceCore(activeTicketIdFromRoute, { messageEmitMode: 'admin_reply' });
}
  