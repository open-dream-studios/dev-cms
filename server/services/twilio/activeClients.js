// server/services/twilio/activeClients.js
// projectId -> Set of client identities
export const projectClients = new Map();

/**
 * Add a client identity to a project
 */
export function addClientToProject(projectId, identity) {
  console.log("setting client", projectId, identity, projectClients)
  if (!projectId || !identity) return;
  if (!projectClients.has(projectId)) projectClients.set(projectId, new Set());
  projectClients.get(projectId).add(identity);
}

/**
 * Remove a client identity from a project
 */
export function removeClientFromProject(projectId, identity) {
  if (!projectId || !identity) return;
  const set = projectClients.get(projectId);
  if (!set) return;
  set.delete(identity);
  if (set.size === 0) projectClients.delete(projectId);
}

/**
 * Get all client identities for a project
 */
export function getClientsForProject(projectId) {
  if (!projectId) return [];
  const set = projectClients.get(projectId);
  return set ? Array.from(set) : [];
}