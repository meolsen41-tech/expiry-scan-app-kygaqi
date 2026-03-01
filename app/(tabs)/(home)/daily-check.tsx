
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import Modal from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import { useStore } from '@/app/_layout';
import {
  startDailyCheckSession,
  getDailyCheckSessions,
  type DailyCheckSession,
} from '@/utils/api';

export default function DailyCheckScreen() {
  const router = useRouter();
  const { currentStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<DailyCheckSession[]>([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [warningDays, setWarningDays] = useState('7');
  const [starting, setStarting] = useState(false);
  const [modalState, setModalState] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    loadSessions();
  }, [currentStore?.id]);

  const loadSessions = async () => {
    console.log('[DailyCheck] Loading sessions');
    if (!currentStore?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getDailyCheckSessions(currentStore.id);
      setSessions(data);
      console.log('[DailyCheck] Loaded sessions:', data.length);
    } catch (error: any) {
      console.error('[DailyCheck] Error loading sessions:', error);
      showModal('error', 'Error', error.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setModalState({ visible: true, type, title, message });
  };

  const handleStartSession = async () => {
    console.log('[DailyCheck] Starting new session');
    if (!currentStore?.id || !currentStore?.memberId) {
      showModal('error', 'Error', 'No store or member ID found');
      return;
    }

    const days = parseInt(warningDays, 10);
    if (isNaN(days) || days < 1 || days > 30) {
      showModal('error', 'Invalid Input', 'Warning days must be between 1 and 30');
      return;
    }

    setStarting(true);
    try {
      const session = await startDailyCheckSession({
        storeId: currentStore.id,
        memberId: currentStore.memberId,
        warningDays: days,
      });
      console.log('[DailyCheck] Session started:', session.id);
      setShowStartModal(false);
      router.push(`/(tabs)/(home)/daily-check-session?sessionId=${session.id}`);
    } catch (error: any) {
      console.error('[DailyCheck] Error starting session:', error);
      showModal('error', 'Error', error.message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  const handleViewSession = (sessionId: string) => {
    console.log('[DailyCheck] Viewing session:', sessionId);
    router.push(`/(tabs)/(home)/daily-check-session?sessionId=${sessionId}`);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentStore) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Expiry Check</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No Store Linked</Text>
          <Text style={styles.emptySubtext}>Please create or join a store first</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Expiry Check</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeSessions = sessions.filter(s => s.status === 'in_progress');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Expiry Check</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Daily check mode helps you systematically review products that are expired or close to expiration.
          </Text>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={() => setShowStartModal(true)}>
          <IconSymbol ios_icon_name="play.circle.fill" android_material_icon_name="play-arrow" size={28} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start New Check Session</Text>
        </TouchableOpacity>

        {activeSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Sessions</Text>
            {activeSessions.map((session) => {
              const startDate = formatDate(session.startedAt);
              const startTime = formatTime(session.startedAt);
              const totalProcessed = session.totalChecked + session.totalDiscounted + session.totalSold + session.totalDiscarded + session.totalSkipped;
              
              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => handleViewSession(session.id)}
                >
                  <View style={styles.sessionHeader}>
                    <View style={[styles.statusBadge, styles.statusActive]}>
                      <Text style={styles.statusText}>In Progress</Text>
                    </View>
                    <Text style={styles.sessionDate}>{startDate} {startTime}</Text>
                  </View>
                  <View style={styles.sessionStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{totalProcessed}</Text>
                      <Text style={styles.statLabel}>Processed</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{session.warningDays}</Text>
                      <Text style={styles.statLabel}>Warning Days</Text>
                    </View>
                  </View>
                  <View style={styles.sessionFooter}>
                    <Text style={styles.continueText}>Tap to continue</Text>
                    <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={20} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {completedSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {completedSessions.slice(0, 10).map((session) => {
              const startDate = formatDate(session.startedAt);
              const totalProcessed = session.totalChecked + session.totalDiscounted + session.totalSold + session.totalDiscarded + session.totalSkipped;
              
              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => handleViewSession(session.id)}
                >
                  <View style={styles.sessionHeader}>
                    <View style={[styles.statusBadge, styles.statusCompleted]}>
                      <Text style={styles.statusText}>Completed</Text>
                    </View>
                    <Text style={styles.sessionDate}>{startDate}</Text>
                  </View>
                  <View style={styles.sessionStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{session.totalChecked}</Text>
                      <Text style={styles.statLabel}>Checked</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{session.totalDiscounted}</Text>
                      <Text style={styles.statLabel}>Discounted</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{session.totalSold}</Text>
                      <Text style={styles.statLabel}>Sold</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{session.totalDiscarded}</Text>
                      <Text style={styles.statLabel}>Discarded</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {sessions.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol ios_icon_name="checkmark.circle" android_material_icon_name="check-circle" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No Check Sessions Yet</Text>
            <Text style={styles.emptySubtext}>Start your first daily check session to begin</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showStartModal}
        type="info"
        title="Start Daily Check"
        message="Configure your check session"
        onClose={() => setShowStartModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalLabel}>Warning Days (products expiring within):</Text>
          <TextInput
            style={styles.modalInput}
            value={warningDays}
            onChangeText={setWarningDays}
            keyboardType="number-pad"
            placeholder="7"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.modalHint}>Products expired, expiring today, or within this many days will be included</Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setShowStartModal(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleStartSession}
              disabled={starting}
            >
              {starting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalButtonText}>Start</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState({ ...modalState, visible: false })}
      />
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 32,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusCompleted: {
    backgroundColor: colors.textSecondary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  continueText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: {
    fontSize: 18,
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
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
