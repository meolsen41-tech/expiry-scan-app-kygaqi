
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import Modal from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import {
  registerForPushNotifications,
  registerPushToken,
  createNotificationSchedule,
  getNotificationSchedules,
  updateNotificationSchedule,
  deleteNotificationSchedule,
  sendExpirationReminders,
  getDayName,
  type NotificationSchedule,
} from '@/utils/notifications';
import { getDeviceId } from '@/utils/deviceId';

export default function NotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string>('');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduleType, setScheduleType] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState(1); // Monday
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('[NotificationsScreen] Loading data');
    setLoading(true);
    try {
      const id = await getDeviceId();
      setDeviceId(id);

      // Register for push notifications
      const token = await registerForPushNotifications();
      setPushToken(token);

      if (token) {
        // Register token with backend
        await registerPushToken(id, token);
        
        // Load schedules
        const loadedSchedules = await getNotificationSchedules(id);
        setSchedules(loadedSchedules);
      }
    } catch (error) {
      console.error('[NotificationsScreen] Error loading data:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to load notification settings.',
        type: 'error',
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    console.log('[NotificationsScreen] Adding schedule');
    setLoading(true);
    try {
      await createNotificationSchedule(
        deviceId,
        scheduleType,
        selectedTime,
        scheduleType === 'weekly' ? selectedDay : undefined
      );
      
      // Reload schedules
      const loadedSchedules = await getNotificationSchedules(deviceId);
      setSchedules(loadedSchedules);
      
      setShowAddSchedule(false);
      setModalConfig({
        title: 'Success',
        message: 'Notification schedule created successfully.',
        type: 'success',
      });
      setModalVisible(true);
    } catch (error) {
      console.error('[NotificationsScreen] Error adding schedule:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to create notification schedule.',
        type: 'error',
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSchedule = async (schedule: NotificationSchedule) => {
    console.log('[NotificationsScreen] Toggling schedule:', schedule.id);
    try {
      await updateNotificationSchedule(schedule.id, { enabled: !schedule.enabled });
      
      // Update local state
      setSchedules(schedules.map(s => 
        s.id === schedule.id ? { ...s, enabled: !s.enabled } : s
      ));
    } catch (error) {
      console.error('[NotificationsScreen] Error toggling schedule:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to update notification schedule.',
        type: 'error',
      });
      setModalVisible(true);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    console.log('[NotificationsScreen] Deleting schedule:', scheduleId);
    try {
      await deleteNotificationSchedule(scheduleId);
      setSchedules(schedules.filter(s => s.id !== scheduleId));
      
      setModalConfig({
        title: 'Success',
        message: 'Notification schedule deleted.',
        type: 'success',
      });
      setModalVisible(true);
    } catch (error) {
      console.error('[NotificationsScreen] Error deleting schedule:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to delete notification schedule.',
        type: 'error',
      });
      setModalVisible(true);
    }
  };

  const handleSendTestNotification = async () => {
    console.log('[NotificationsScreen] Sending test notification');
    setLoading(true);
    try {
      const result = await sendExpirationReminders(deviceId);
      setModalConfig({
        title: 'Test Sent',
        message: `Sent ${result.notificationsSent} expiration reminder(s).`,
        type: 'success',
      });
      setModalVisible(true);
    } catch (error) {
      console.error('[NotificationsScreen] Error sending test:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to send test notification.',
        type: 'error',
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleDescription = (schedule: NotificationSchedule): string => {
    if (schedule.scheduleType === 'daily') {
      return `Daily at ${schedule.timeOfDay}`;
    } else {
      const dayName = getDayName(schedule.dayOfWeek || 0);
      return `Every ${dayName} at ${schedule.timeOfDay}`;
    }
  };

  if (loading && schedules.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notification settings...</Text>
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
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!pushToken && (
          <View style={styles.warningCard}>
            <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={24} color="#F59E0B" />
            <Text style={styles.warningText}>
              Push notifications are not available. Please enable notifications in your device settings.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduled Reminders</Text>
          <Text style={styles.sectionDescription}>
            Get automatic reminders about products expiring soon
          </Text>

          {schedules.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol ios_icon_name="bell.slash.fill" android_material_icon_name="notifications-off" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No scheduled reminders</Text>
              <Text style={styles.emptySubtext}>Add a schedule to get automatic notifications</Text>
            </View>
          ) : (
            <View style={styles.scheduleList}>
              {schedules.map((schedule) => {
                const description = getScheduleDescription(schedule);
                return (
                  <View key={schedule.id} style={styles.scheduleCard}>
                    <View style={styles.scheduleInfo}>
                      <IconSymbol 
                        ios_icon_name={schedule.scheduleType === 'daily' ? 'calendar' : 'calendar.badge.clock'} 
                        android_material_icon_name={schedule.scheduleType === 'daily' ? 'calendar-today' : 'event'} 
                        size={24} 
                        color={schedule.enabled ? colors.primary : colors.textSecondary} 
                      />
                      <View style={styles.scheduleText}>
                        <Text style={styles.scheduleDescription}>{description}</Text>
                        <Text style={styles.scheduleStatus}>
                          {schedule.enabled ? 'Active' : 'Disabled'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.scheduleActions}>
                      <Switch
                        value={schedule.enabled}
                        onValueChange={() => handleToggleSchedule(schedule)}
                        trackColor={{ false: colors.cardBorder, true: colors.primary }}
                        thumbColor="#FFFFFF"
                      />
                      <TouchableOpacity
                        onPress={() => handleDeleteSchedule(schedule.id)}
                        style={styles.deleteButton}
                      >
                        <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {!showAddSchedule ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddSchedule(true)}
              disabled={!pushToken}
            >
              <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add-circle" size={24} color={pushToken ? colors.primary : colors.textSecondary} />
              <Text style={[styles.addButtonText, !pushToken && styles.disabledText]}>
                Add Schedule
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addScheduleForm}>
              <Text style={styles.formLabel}>Schedule Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[styles.typeButton, scheduleType === 'daily' && styles.typeButtonActive]}
                  onPress={() => setScheduleType('daily')}
                >
                  <Text style={[styles.typeButtonText, scheduleType === 'daily' && styles.typeButtonTextActive]}>
                    Daily
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, scheduleType === 'weekly' && styles.typeButtonActive]}
                  onPress={() => setScheduleType('weekly')}
                >
                  <Text style={[styles.typeButtonText, scheduleType === 'weekly' && styles.typeButtonTextActive]}>
                    Weekly
                  </Text>
                </TouchableOpacity>
              </View>

              {scheduleType === 'weekly' && (
                <>
                  <Text style={styles.formLabel}>Day of Week</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.dayButton, selectedDay === index && styles.dayButtonActive]}
                        onPress={() => setSelectedDay(index)}
                      >
                        <Text style={[styles.dayButtonText, selectedDay === index && styles.dayButtonTextActive]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={styles.formLabel}>Time</Text>
              <View style={styles.timeButtons}>
                {['09:00', '12:00', '15:00', '18:00'].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeButton, selectedTime === time && styles.timeButtonActive]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.timeButtonText, selectedTime === time && styles.timeButtonTextActive]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddSchedule(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAddSchedule}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Saving...' : 'Save Schedule'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          <Text style={styles.sectionDescription}>
            Send a test notification for products expiring soon
          </Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleSendTestNotification}
            disabled={loading || !pushToken}
          >
            <IconSymbol ios_icon_name="paperplane.fill" android_material_icon_name="send" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  scheduleList: {
    gap: 12,
    marginBottom: 16,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  scheduleText: {
    flex: 1,
  },
  scheduleDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  scheduleStatus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scheduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  addScheduleForm: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  dayScroll: {
    marginBottom: 8,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    marginRight: 8,
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  timeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  timeButtonActive: {
    backgroundColor: colors.primary,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timeButtonTextActive: {
    color: '#FFFFFF',
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
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
