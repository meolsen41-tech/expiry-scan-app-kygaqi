
import { apiPost, apiGet, apiDelete, BACKEND_URL } from './api';
import { ProductEntry } from './api';

export interface Team {
  id: string;
  name: string;
  inviteCode: string;
  role: 'owner' | 'member';
  memberCount: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  deviceName: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface TeamEntry extends ProductEntry {
  scannedBy: string;
}

/**
 * Create a new team
 */
export async function createTeam(deviceId: string, teamName: string, deviceName: string): Promise<Team> {
  console.log('[Teams] Creating team:', teamName);
  return apiPost('/api/teams', { deviceId, teamName, deviceName });
}

/**
 * Join a team with invite code
 */
export async function joinTeam(
  inviteCode: string,
  deviceId: string,
  deviceName: string
): Promise<{ success: boolean; team: Team; member: TeamMember }> {
  console.log('[Teams] Joining team with code:', inviteCode);
  return apiPost('/api/teams/join', { inviteCode, deviceId, deviceName });
}

/**
 * Get teams for device
 */
export async function getTeams(deviceId: string): Promise<Team[]> {
  console.log('[Teams] Fetching teams for device:', deviceId);
  return apiGet(`/api/teams/${deviceId}`);
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  console.log('[Teams] Fetching members for team:', teamId);
  return apiGet(`/api/teams/${teamId}/members`);
}

/**
 * Get team entries (all product entries from team members)
 */
export async function getTeamEntries(teamId: string): Promise<TeamEntry[]> {
  console.log('[Teams] Fetching entries for team:', teamId);
  return apiGet(`/api/teams/${teamId}/entries`);
}

/**
 * Leave a team
 */
export async function leaveTeam(teamId: string, deviceId: string): Promise<{ success: boolean }> {
  console.log('[Teams] Leaving team:', teamId);
  // DELETE with body requires special handling
  const url = `${BACKEND_URL}/api/teams/${teamId}/leave`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to leave team' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Delete a team (owner only)
 */
export async function deleteTeam(teamId: string, deviceId: string): Promise<{ success: boolean }> {
  console.log('[Teams] Deleting team:', teamId);
  // DELETE with body requires special handling
  const url = `${BACKEND_URL}/api/teams/${teamId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete team' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}
