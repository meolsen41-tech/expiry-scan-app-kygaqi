
import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/utils/i18n";

export default function ProfileScreen() {
  const theme = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = async (lang: Language) => {
    console.log('[ProfileScreen] Changing language to:', lang);
    await setLanguage(lang);
  };

  const languageLabel = language === 'en' ? 'English' : 'Norsk';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== 'ios' && styles.contentContainerWithTabBar
        ]}
      >
        <GlassView style={[
          styles.profileHeader,
          Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        ]} glassEffectStyle="regular">
          <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="person" size={80} color={theme.colors.primary} />
          <Text style={[styles.name, { color: theme.colors.text }]}>John Doe</Text>
          <Text style={[styles.email, { color: theme.dark ? '#98989D' : '#666' }]}>john.doe@example.com</Text>
        </GlassView>

        <GlassView style={[
          styles.section,
          Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        ]} glassEffectStyle="regular">
          <View style={styles.infoRow}>
            <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={20} color={theme.dark ? '#98989D' : '#666'} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>+1 (555) 123-4567</Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={20} color={theme.dark ? '#98989D' : '#666'} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>San Francisco, CA</Text>
          </View>
        </GlassView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('settings.language')}
          </Text>
        </View>

        <GlassView style={[
          styles.section,
          Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        ]} glassEffectStyle="regular">
          <TouchableOpacity
            style={[
              styles.languageOption,
              language === 'en' && styles.languageOptionActive,
              language === 'en' && { backgroundColor: theme.colors.primary + '20' }
            ]}
            onPress={() => handleLanguageChange('en')}
          >
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, { color: theme.colors.text }]}>English</Text>
              <Text style={[styles.languageNative, { color: theme.dark ? '#98989D' : '#666' }]}>English</Text>
            </View>
            {language === 'en' && (
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.dark ? '#38383A' : '#E5E5EA' }]} />

          <TouchableOpacity
            style={[
              styles.languageOption,
              language === 'no' && styles.languageOptionActive,
              language === 'no' && { backgroundColor: theme.colors.primary + '20' }
            ]}
            onPress={() => handleLanguageChange('no')}
          >
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, { color: theme.colors.text }]}>Norwegian</Text>
              <Text style={[styles.languageNative, { color: theme.dark ? '#98989D' : '#666' }]}>Norsk</Text>
            </View>
            {language === 'no' && (
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </GlassView>

        <View style={styles.languageNote}>
          <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={16} color={theme.dark ? '#98989D' : '#666'} />
          <Text style={[styles.languageNoteText, { color: theme.dark ? '#98989D' : '#666' }]}>
            {t('settings.languageNote')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor handled dynamically
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  contentContainerWithTabBar: {
    paddingBottom: 100, // Extra padding for floating tab bar
  },
  profileHeader: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    gap: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    // color handled dynamically
  },
  email: {
    fontSize: 16,
    // color handled dynamically
  },
  section: {
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    // color handled dynamically
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    // color handled dynamically
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  languageOptionActive: {
    // backgroundColor handled dynamically
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    // color handled dynamically
  },
  languageNative: {
    fontSize: 14,
    // color handled dynamically
  },
  divider: {
    height: 1,
    marginVertical: 8,
    // backgroundColor handled dynamically
  },
  languageNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  languageNoteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    // color handled dynamically
  },
});
