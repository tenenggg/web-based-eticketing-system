// Imports
import { useWorkspaceCore } from '../shared/useWorkspaceCore.js';




// User workspace — replies via send_message socket event
export function useUserWorkspace(activeTicketIdFromRoute) {
  return useWorkspaceCore(activeTicketIdFromRoute, { messageEmitMode: 'send_message' });
}
