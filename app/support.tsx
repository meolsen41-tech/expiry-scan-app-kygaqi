
import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { GlassView } from 'expo-glass-effect';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

const SUPPORT_EMAIL = 'support@datokontroll.app';

const SUPPORT_TOPICS = [
  { id: 'app-issues', label: 'App issues', icon_ios: 'exclamationmark.circle', icon_android: 'error' },
  { id: 'store-setup', label: 'Store setup', icon_ios: 'building.2', icon_android: 'store' },
  { id: 'employee-access', label: 'Employee access', icon_ios: 'person.2', icon_android: 'group' },
  { id: 'feature-requests', label: 'Feature requests', icon_ios: 'lightbulb', icon_android: 'lightbulb' },
];

export default function SupportScreen() {
  const theme = useTheme();

  const handleEmailPress = () => {
    console.log('[SupportScreen] Email tapped:', SUPPORT_EMAIL);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const dividerColor = theme.dark ? '#38383A' : '#E5E5EA';
  const subtitleColor = theme.dark ? '#98989D' : '#666';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Support',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <View style={styles.container}>
          <View style={styles.contentContainer}>

            {/* Header */}
            <View style={styles.headerSection}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '18' }]}>
                <IconSymbol
                  ios_icon_name="questionmark.circle.fill"
                  android_material_icon_name="help"
                  size={36}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.title, { color: theme.colors.text }]}>Datokontroll Support</Text>
              <Text style={[styles.subtitle, { color: subtitleColor }]}>
                If you need help with the Datokontroll app, please contact us.
              </Text>
            </View>

            {/* Email section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contact</Text>
            </View>

            <GlassView
              style={[
                styles.section,
                Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
              ]}
              glassEffectStyle="regular"
            >
              <TouchableOpacity style={styles.emailRow} onPress={handleEmailPress} activeOpacity={0.7}>
                <View style={styles.emailLeft}>
                  <IconSymbol
                    ios_icon_name="envelope.fill"
                    android_material_icon_name="email"
                    size={22}
                    color={colors.primary}
                  />
                  <View style={styles.emailTextContainer}>
                    <Text style={[styles.emailLabel, { color: subtitleColor }]}>Email</Text>
                    <Text style={[styles.emailAddress, { color: colors.primary }]}>{SUPPORT_EMAIL}</Text>
                  </View>
                </View>
                <IconSymbol
                  ios_icon_name="arrow.up.right"
                  android_material_icon_name="open-in-new"
                  size={16}
                  color={subtitleColor}
                />
              </TouchableOpacity>
            </GlassView>

            {/* Support topics section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Support topics</Text>
            </View>

            <GlassView
              style={[
                styles.section,
                Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
              ]}
              glassEffectStyle="regular"
            >
              {SUPPORT_TOPICS.map((topic, index) => (
                <View key={topic.id}>
                  <View style={styles.topicRow}>
                    <IconSymbol
                      ios_icon_name={topic.icon_ios}
                      android_material_icon_name={topic.icon_android}
                      size={20}
                      color={subtitleColor}
                    />
                    <Text style={[styles.topicLabel, { color: theme.colors.text }]}>{topic.label}</Text>
                  </View>
                  {index < SUPPORT_TOPICS.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                  )}
                </View>
              ))}
            </GlassView>

            {/* Footer */}
            <Text style={[styles.footer, { color: subtitleColor }]}>
              We aim to respond within 48 hours.
            </Text>

          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 8,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    borderRadius: 12,
    padding: 16,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  emailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emailTextContainer: {
    flex: 1,
  },
  emailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  emailAddress: {
    fontSize: 16,
    fontWeight: '500',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  topicLabel: {
    fontSize: 16,
  },
  divider: {
    height: 1,
  },
  footer: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
