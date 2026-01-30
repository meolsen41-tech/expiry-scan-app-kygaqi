
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import Modal from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import {
  createTeam,
  joinTeam,
  getTeams,
  getTeamMembers,
  getTeamEntries,
  leaveTeam,
  deleteTeam,
  type Team,
  type TeamMember,
  type TeamEntry,
} from '@/utils/teams';
import { getDeviceId, getDeviceName } from '@/utils/deviceId';

export default function TeamsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamEntries, setTeamEntries] = useState<TeamEntry[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    onConfirm: undefined as (() => void) | undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('[Teams] Loading data');
    setLoading(true);
    try {
      const id = await getDeviceId();
      const name = getDeviceName();
      setDeviceId(id);
      setDeviceName(name);

      const loadedTeams = await getTeams(id);
      setTeams(loadedTeams);
    } catch (error) {
      console.error('[Teams] Error loading data:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to load teams.',
        type: 'error',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setModalConfig({
        title: 'Missing Name',
        message: 'Please enter a team name.',
        type: 'warning',
        onConfirm: undefined,
      });
      setModalVisible(true);
      return;
    }

    console.log('[Teams] Creating team:', newTeamName);
    setLoading(true);
    try {
      const team = await createTeam(deviceId, newTeamName, deviceName);
      setTeams([team, ...teams]);
      setNewTeamName('');
      setShowCreateForm(false);

      setModalConfig({
        title: 'Team Created',
        message: `Team "${team.name}" created. Share invite code: ${team.inviteCode}`,
        type: 'success',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } catch (error) {
      console.error('[Teams] Error creating team:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to create team.',
        type: 'error',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      setModalConfig({
        title: 'Missing Code',
        message: 'Please enter an invite code.',
        type: 'warning',
        onConfirm: undefined,
      });
      setModalVisible(true);
      return;
    }

    console.log('[Teams] Joining team with code:', inviteCode);
    setLoading(true);
    try {
      const result = await joinTeam(inviteCode.toUpperCase(), deviceId, deviceName);
      setTeams([result.team, ...teams]);
      setInviteCode('');
      setShowJoinForm(false);

      setModalConfig({
        title: 'Joined Team',
        message: `Successfully joined "${result.team.name}".`,
        type: 'success',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } catch (error) {
      console.error('[Teams] Error joining team:', error);
      setModalConfig({
        title: 'Error',
        message: 'Invalid invite code or failed to join team.',
        type: 'error',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = async (team: Team) => {
    console.log('[Teams] Selecting team:', team.id);
    setSelectedTeam(team);
    setLoading(true);
    try {
      const [members, entries] = await Promise.all([
        getTeamMembers(team.id),
        getTeamEntries(team.id),
      ]);
      setTeamMembers(members);
      setTeamEntries(entries);
    } catch (error) {
      console.error('[Teams] Error loading team details:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to load team details.',
        type: 'error',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId: string, teamName: string) => {
    setModalConfig({
      title: 'Leave Team?',
      message: `Are you sure you want to leave "${teamName}"?`,
      type: 'warning',
      onConfirm: async () => {
        console.log('[Teams] Leaving team:', teamId);
        setLoading(true);
        try {
          await leaveTeam(teamId, deviceId);
          setTeams(teams.filter(t => t.id !== teamId));
          setSelectedTeam(null);
          setTeamMembers([]);
          setTeamEntries([]);

          setModalConfig({
            title: 'Left Team',
            message: `You have left "${teamName}".`,
            type: 'success',
            onConfirm: undefined,
          });
          setModalVisible(true);
        } catch (error) {
          console.error('[Teams] Error leaving team:', error);
          setModalConfig({
            title: 'Error',
            message: 'Failed to leave team.',
            type: 'error',
            onConfirm: undefined,
          });
          setModalVisible(true);
        } finally {
          setLoading(false);
        }
      },
    });
    setModalVisible(true);
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    setModalConfig({
      title: 'Delete Team?',
      message: `This will delete "${teamName}" and remove all members. This cannot be undone.`,
      type: 'error',
      onConfirm: async () => {
        console.log('[Teams] Deleting team:', teamId);
        setLoading(true);
        try {
          await deleteTeam(teamId, deviceId);
          setTeams(teams.filter(t => t.id !== teamId));
          setSelectedTeam(null);
          setTeamMembers([]);
          setTeamEntries([]);

          setModalConfig({
            title: 'Team Deleted',
            message: `"${teamName}" has been deleted.`,
            type: 'success',
            onConfirm: undefined,
          });
          setModalVisible(true);
        } catch (error) {
          console.error('[Teams] Error deleting team:', error);
          setModalConfig({
            title: 'Error',
            message: 'Failed to delete team. Only the team owner can delete the team.',
            type: 'error',
            onConfirm: undefined,
          });
          setModalVisible(true);
        } finally {
          setLoading(false);
        }
      },
    });
    setModalVisible(true);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'fresh':
        return '#10B981';
      case 'expiring_soon':
        return '#F59E0B';
      case 'expired':
        return '#EF4444';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'fresh':
        return 'Fresh';
      case 'expiring_soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading && teams.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading teams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.onConfirm ? 'Confirm' : undefined}
        cancelText={modalConfig.onConfirm ? 'Cancel' : undefined}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => selectedTeam ? setSelectedTeam(null) : router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedTeam ? selectedTeam.name : 'Teams'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {selectedTeam ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.teamDetailCard}>
            <View style={styles.teamDetailHeader}>
              <View style={styles.teamDetailInfo}>
                <Text style={styles.teamDetailName}>{selectedTeam.name}</Text>
                <Text style={styles.teamDetailCode}>Invite Code: {selectedTeam.inviteCode}</Text>
                <Text style={styles.teamDetailRole}>
                  Your Role: {selectedTeam.role === 'owner' ? 'Owner' : 'Member'}
                </Text>
              </View>
            </View>

            <View style={styles.teamActions}>
              {selectedTeam.role === 'owner' ? (
                <TouchableOpacity
                  style={styles.deleteTeamButton}
                  onPress={() => handleDeleteTeam(selectedTeam.id, selectedTeam.name)}
                  disabled={loading}
                >
                  <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color="#FFFFFF" />
                  <Text style={styles.deleteTeamButtonText}>Delete Team</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.leaveTeamButton}
                  onPress={() => handleLeaveTeam(selectedTeam.id, selectedTeam.name)}
                  disabled={loading}
                >
                  <IconSymbol ios_icon_name="arrow.right.square.fill" android_material_icon_name="exit-to-app" size={20} color="#FFFFFF" />
                  <Text style={styles.leaveTeamButtonText}>Leave Team</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Members ({teamMembers.length})</Text>
            {teamMembers.map((member) => {
              const joinedDate = formatDate(member.joinedAt);
              return (
                <View key={member.id} style={styles.memberCard}>
                  <IconSymbol 
                    ios_icon_name={member.role === 'owner' ? 'crown.fill' : 'person.fill'} 
                    android_material_icon_name={member.role === 'owner' ? 'star' : 'person'} 
                    size={24} 
                    color={member.role === 'owner' ? '#F59E0B' : colors.primary} 
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.deviceName}</Text>
                    <Text style={styles.memberDetails}>
                      {member.role === 'owner' ? 'Owner' : 'Member'} • Joined {joinedDate}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Products ({teamEntries.length})</Text>
            {teamEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No products scanned yet</Text>
              </View>
            ) : (
              teamEntries.map((entry) => {
                const statusColor = getStatusColor(entry.status);
                const statusText = getStatusText(entry.status);
                const expirationDate = formatDate(entry.expirationDate);
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>{entry.productName}</Text>
                      <Text style={styles.entryDetails}>
                        Expires: {expirationDate} • Scanned by: {entry.scannedBy}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusText}>{statusText}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {teams.length === 0 && !showCreateForm && !showJoinForm ? (
            <View style={styles.emptyState}>
              <IconSymbol ios_icon_name="person.3.fill" android_material_icon_name="group" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No Teams Yet</Text>
              <Text style={styles.emptySubtext}>Create a team or join one with an invite code</Text>
            </View>
          ) : (
            <View style={styles.teamsList}>
              {teams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={styles.teamCard}
                  onPress={() => handleSelectTeam(team)}
                >
                  <View style={styles.teamCardInfo}>
                    <Text style={styles.teamCardName}>{team.name}</Text>
                    <Text style={styles.teamCardDetails}>
                      {team.memberCount} members • {team.role === 'owner' ? 'Owner' : 'Member'}
                    </Text>
                    <Text style={styles.teamCardCode}>Code: {team.inviteCode}</Text>
                  </View>
                  <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showCreateForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Create Team</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Team Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                  placeholder="e.g., Store Team A"
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                />
              </View>
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.buttonDisabled]}
                  onPress={handleCreateTeam}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showJoinForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Join Team</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Invite Code *</Text>
                <TextInput
                  style={styles.input}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="Enter 6-character code"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  maxLength={6}
                  autoFocus
                />
              </View>
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowJoinForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.buttonDisabled]}
                  onPress={handleJoinTeam}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Joining...' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!showCreateForm && !showJoinForm && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateForm(true)}
              >
                <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add-circle" size={24} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Team</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => setShowJoinForm(true)}
              >
                <IconSymbol ios_icon_name="person.badge.plus.fill" android_material_icon_name="person-add" size={24} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>Join Team</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  teamsList: {
    gap: 12,
    marginBottom: 20,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  teamCardInfo: {
    flex: 1,
  },
  teamCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  teamCardDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  teamCardCode: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionButtons: {
    gap: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginTop: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  teamDetailCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginBottom: 24,
  },
  teamDetailHeader: {
    marginBottom: 16,
  },
  teamDetailInfo: {
    marginBottom: 16,
  },
  teamDetailName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  teamDetailCode: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  teamDetailRole: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  teamActions: {
    gap: 12,
  },
  deleteTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  deleteTeamButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leaveTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  leaveTeamButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  memberDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  entryDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
