
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '@/contexts/LanguageContext';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import type { Language } from '@/utils/i18n';

export default function SettingsScreen() {
  const theme = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] = useState<ImagePicker.MediaLibraryPermissionResponse | null>(null);
  
  useEffect(() => {
    loadPermissions();
  }, []);
  
  const loadPermissions = async () => {
    const media = await ImagePicker.getMediaLibraryPermissionsAsync();
    setMediaPermission(media);
  };
  
  const handleRequestCameraPermission = async () => {
    await requestCameraPermission();
  };
  
  const handleRequestMediaPermission = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setMediaPermission(result);
  };
  
  const handleOpenSettings = () => {
    Linking.openSettings();
  };
  
  const handleLanguageChange = async (lang: Language) => {
    console.log('[SettingsScreen] Changing language to:', lang);
    await setLanguage(lang);
  };
  
  const getPermissionStatus = (granted: boolean | undefined): string => {
    if (granted === undefined) return t('settingsScreen.notDetermined');
    return granted ? t('settingsScreen.granted') : t('settingsScreen.denied');
  };
  
  const getPermissionColor = (granted: boolean | undefined): string => {
    if (granted === undefined) return theme.dark ? '#98989D' : '#666';
    return granted ? colors.success : colors.error;
  };
  
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';
  
  const languageLabel = language === 'en' ? 'English' : 'Norsk';
  
  return (
    <>
      <Stack.Screen
        options={{
          title: t('settingsScreen.title'),
          headerShown: true,
          headerBackTitle: t('common.back'),
        }}
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settingsScreen.permissions')}</Text>
          </View>
          
          <GlassView style={[
            styles.section,
            Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]} glassEffectStyle="regular">
            <View style={styles.permissionItem}>
              <View style={styles.permissionInfo}>
                <IconSymbol ios_icon_name="camera.fill" android_material_icon_name="camera" size={24} color={theme.colors.text} />
                <View style={styles.permissionDetails}>
                  <Text style={[styles.permissionName, { color: theme.colors.text }]}>{t('settingsScreen.cameraPermission')}</Text>
                  <Text style={[styles.permissionStatus, { color: getPermissionColor(cameraPermission?.granted) }]}>
                    {getPermissionStatus(cameraPermission?.granted)}
                  </Text>
                </View>
              </View>
              {!cameraPermission?.granted && cameraPermission?.canAskAgain && (
                <TouchableOpacity
                  style={[styles.permissionButton, { backgroundColor: colors.primary }]}
                  onPress={handleRequestCameraPermission}
                >
                  <Text style={styles.permissionButtonText}>{t('scanner.grantPermission')}</Text>
                </TouchableOpacity>
              )}
              {!cameraPermission?.granted && !cameraPermission?.canAskAgain && (
                <TouchableOpacity
                  style={[styles.permissionButton, { backgroundColor: colors.primary }]}
                  onPress={handleOpenSettings}
                >
                  <Text style={styles.permissionButtonText}>{t('settingsScreen.openSettings')}</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.dark ? '#38383A' : '#E5E5EA' }]} />
            
            <View style={styles.permissionItem}>
              <View style={styles.permissionInfo}>
                <IconSymbol ios_icon_name="photo.fill" android_material_icon_name="photo" size={24} color={theme.colors.text} />
                <View style={styles.permissionDetails}>
                  <Text style={[styles.permissionName, { color: theme.colors.text }]}>{t('settingsScreen.photoPermission')}</Text>
                  <Text style={[styles.permissionStatus, { color: getPermissionColor(mediaPermission?.granted) }]}>
                    {getPermissionStatus(mediaPermission?.granted)}
                  </Text>
                </View>
              </View>
              {!mediaPermission?.granted && mediaPermission?.canAskAgain && (
                <TouchableOpacity
                  style={[styles.permissionButton, { backgroundColor: colors.primary }]}
                  onPress={handleRequestMediaPermission}
                >
                  <Text style={styles.permissionButtonText}>{t('scanner.grantPermission')}</Text>
                </TouchableOpacity>
              )}
              {!mediaPermission?.granted && !mediaPermission?.canAskAgain && (
                <TouchableOpacity
                  style={[styles.permissionButton, { backgroundColor: colors.primary }]}
                  onPress={handleOpenSettings}
                >
                  <Text style={styles.permissionButtonText}>{t('settingsScreen.openSettings')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </GlassView>
          
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settings.language')}</Text>
          </View>
          
          <GlassView style={[
            styles.section,
            Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]} glassEffectStyle="regular">
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'en' && styles.languageOptionActive,
                language === 'en' && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, { color: theme.colors.text }]}>English</Text>
              </View>
              {language === 'en' && (
                <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: theme.dark ? '#38383A' : '#E5E5EA' }]} />
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'no' && styles.languageOptionActive,
                language === 'no' && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => handleLanguageChange('no')}
            >
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, { color: theme.colors.text }]}>Norsk</Text>
              </View>
              {language === 'no' && (
                <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </GlassView>
          
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settingsScreen.about')}</Text>
          </View>
          
          <GlassView style={[
            styles.section,
            Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]} glassEffectStyle="regular">
            <TouchableOpacity style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: theme.colors.text }]}>{t('settingsScreen.privacyPolicy')}</Text>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={theme.dark ? '#98989D' : '#666'} />
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: theme.dark ? '#38383A' : '#E5E5EA' }]} />
            
            <TouchableOpacity style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: theme.colors.text }]}>{t('settingsScreen.feedback')}</Text>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={theme.dark ? '#98989D' : '#666'} />
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: theme.dark ? '#38383A' : '#E5E5EA' }]} />
            
            <View style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: theme.colors.text }]}>{t('settingsScreen.version')}</Text>
              <Text style={[styles.aboutValue, { color: theme.dark ? '#98989D' : '#666' }]}>{appVersion}</Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.dark ? '#38383A' : '#E5E5EA' }]} />
            
            <View style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: theme.colors.text }]}>{t('settingsScreen.build')}</Text>
              <Text style={[styles.aboutValue, { color: theme.dark ? '#98989D' : '#666' }]}>{buildNumber}</Text>
            </View>
          </GlassView>
        </ScrollView>
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
  permissionItem: {
    paddingVertical: 8,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  permissionDetails: {
    flex: 1,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  permissionStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  permissionButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
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
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  aboutLabel: {
    fontSize: 16,
  },
  aboutValue: {
    fontSize: 16,
  },
});
