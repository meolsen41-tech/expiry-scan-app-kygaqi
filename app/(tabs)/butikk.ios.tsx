
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter, useFocusEffect } from 'expo-router';
import Modal from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import { getDeviceId } from '@/utils/deviceId';
import { useStore } from '@/app/_layout';
import {
  createStore,
  joinStore,
  getCurrentStore,
  getStoreMembers,
  leaveStore,
  deleteStore,
  type CurrentStore,
  type Member,
} from '@/utils/stores';

export default function ButikkScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { refreshStore: refreshStoreContext } = useStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentStore, setCurrentStore] = useState<CurrentStore | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [createNickname, setCreateNickname] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinNickname, setJoinNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | undefined>(undefined);
  
  const showModal = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOnConfirm(() => onConfirm);
    setModalVisible(true);
  };
  
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      const deviceId = await getDeviceId();
      const store = await getCurrentStore(deviceId);
      setCurrentStore(store);
      
      if (store) {
        const storeMembers = await getStoreMembers(store.id);
        setMembers(storeMembers);
      } else {
        setMembers([]);
      }
      // Also refresh the global store context so scanner/batch-scan get updated storeId
      await refreshStoreContext();
    } catch (error: any) {
      console.error('[ButikkScreen] Error loading data:', error);
      showModal('error', t('common.error'), error.message || t('store.loadError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateStore = async () => {
    const trimmedName = storeName.trim();
    const trimmedNickname = createNickname.trim();
    
    if (!trimmedName) {
      showModal('warning', t('store.missingName'), t('store.missingNameMessage'));
      return;
    }
    
    if (!trimmedNickname) {
      showModal('warning', t('store.missingNickname'), t('store.missingNicknameMessage'));
      return;
    }
    
    try {
      setIsCreating(true);
      const deviceId = await getDeviceId();
      const store = await createStore(trimmedName, trimmedNickname, deviceId);
      
      const successMessage = t('store.storeCreatedMessage', { name: store.name, code: store.storeCode });
      showModal('success', t('store.storeCreated'), successMessage);
      
      setStoreName('');
      setCreateNickname('');
      setShowCreateForm(false);
      
      await loadData();
    } catch (error: any) {
      console.error('[ButikkScreen] Error creating store:', error);
      showModal('error', t('common.error'), error.message || t('store.createError'));
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleJoinStore = async () => {
    const trimmedCode = joinCode.trim().toUpperCase();
    const trimmedNickname = joinNickname.trim();
    
    if (!trimmedCode) {
      showModal('warning', t('store.missingCode'), t('store.missingCodeMessage'));
      return;
    }
    
    if (!trimmedNickname) {
      showModal('warning', t('store.missingNickname'), t('store.missingNicknameMessage'));
      return;
    }
    
    try {
      setIsJoining(true);
      const deviceId = await getDeviceId();
      const result = await joinStore(trimmedCode, trimmedNickname, deviceId);
      
      const successMessage = t('store.joinedStoreMessage', { name: result.store.name });
      showModal('success', t('store.joinedStore'), successMessage);
      
      setJoinCode('');
      setJoinNickname('');
      setShowJoinForm(false);
      
      await loadData();
    } catch (error: any) {
      console.error('[ButikkScreen] Error joining store:', error);
      showModal('error', t('common.error'), error.message || t('store.joinError'));
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleShareCode = async () => {
    if (!currentStore) return;
    
    try {
      await Share.share({
        message: `${t('store.storeCode')}: ${currentStore.storeCode}\n${t('store.storeName')}: ${currentStore.name}`,
      });
    } catch (error: any) {
      console.error('[ButikkScreen] Error sharing code:', error);
    }
  };
  
  const handleShowQR = () => {
    showModal('info', t('store.showQR'), `${t('store.storeCode')}: ${currentStore?.storeCode}`);
  };
  
  const handleSwitchStore = () => {
    if (!currentStore) return;
    
    const confirmMessage = t('store.leaveStoreConfirm', { name: currentStore.name });
    showModal('warning', t('store.switchStore'), confirmMessage, async () => {
      try {
        const deviceId = await getDeviceId();
        await leaveStore(currentStore.id, deviceId);
        
        const successMessage = t('store.leftStoreMessage', { name: currentStore.name });
        showModal('success', t('store.leftStore'), successMessage);
        
        await loadData();
      } catch (error: any) {
        console.error('[ButikkScreen] Error leaving store:', error);
        showModal('error', t('common.error'), error.message || t('store.leaveError'));
      }
    });
  };
  
  const handleLeaveStore = () => {
    if (!currentStore) return;
    
    const confirmMessage = t('store.leaveStoreConfirm', { name: currentStore.name });
    showModal('warning', t('store.leaveStore'), confirmMessage, async () => {
      try {
        const deviceId = await getDeviceId();
        await leaveStore(currentStore.id, deviceId);
        
        const successMessage = t('store.leftStoreMessage', { name: currentStore.name });
        showModal('success', t('store.leftStore'), successMessage);
        
        await loadData();
      } catch (error: any) {
        console.error('[ButikkScreen] Error leaving store:', error);
        showModal('error', t('common.error'), error.message || t('store.leaveError'));
      }
    });
  };
  
  const handleDeleteStore = () => {
    if (!currentStore) return;
    
    const confirmMessage = t('store.deleteStoreConfirm', { name: currentStore.name });
    showModal('warning', t('store.deleteStore'), confirmMessage, async () => {
      try {
        const deviceId = await getDeviceId();
        await deleteStore(currentStore.id, deviceId);
        
        const successMessage = t('store.storeDeletedMessage', { name: currentStore.name });
        showModal('success', t('store.storeDeleted'), successMessage);
        
        await loadData();
      } catch (error: any) {
        console.error('[ButikkScreen] Error deleting store:', error);
        showModal('error', t('common.error'), error.message || t('store.deleteError'));
      }
    });
  };
  
  const handleOpenSettings = () => {
    router.push('/settings');
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {!currentStore ? (
          <>
            <View style={styles.header}>
              <IconSymbol ios_icon_name="storefront" android_material_icon_name="store" size={60} color={colors.primary} />
              <Text style={[styles.title, { color: theme.colors.text }]}>{t('store.notLinked')}</Text>
              <Text style={[styles.subtitle, { color: theme.dark ? '#98989D' : '#666' }]}>{t('store.notLinkedSubtext')}</Text>
            </View>
            
            {!showCreateForm && !showJoinForm && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowCreateForm(true)}
                >
                  <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add-circle" size={24} color="#fff" />
                  <Text style={styles.primaryButtonText}>{t('store.createStore')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.primary }]}
                  onPress={() => setShowJoinForm(true)}
                >
                  <IconSymbol ios_icon_name="link.circle.fill" android_material_icon_name="link" size={24} color={colors.primary} />
                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{t('store.joinStore')}</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {showCreateForm && (
              <GlassView style={styles.formContainer} glassEffectStyle="regular">
                <Text style={[styles.formTitle, { color: theme.colors.text }]}>{t('store.createStore')}</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>{t('store.storeName')}</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.dark ? '#38383A' : '#E5E5EA' }]}
                    placeholder={t('store.storeNamePlaceholder')}
                    placeholderTextColor={theme.dark ? '#98989D' : '#999'}
                    value={storeName}
                    onChangeText={setStoreName}
                    autoCapitalize="words"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>{t('store.nickname')}</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.dark ? '#38383A' : '#E5E5EA' }]}
                    placeholder={t('store.nicknamePlaceholder')}
                    placeholderTextColor={theme.dark ? '#98989D' : '#999'}
                    value={createNickname}
                    onChangeText={setCreateNickname}
                    autoCapitalize="words"
                  />
                </View>
                
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: theme.dark ? '#38383A' : '#E5E5EA' }]}
                    onPress={() => {
                      setShowCreateForm(false);
                      setStoreName('');
                      setCreateNickname('');
                    }}
                    disabled={isCreating}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleCreateStore}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>{t('store.create')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </GlassView>
            )}
            
            {showJoinForm && (
              <GlassView style={styles.formContainer} glassEffectStyle="regular">
                <Text style={[styles.formTitle, { color: theme.colors.text }]}>{t('store.joinStore')}</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>{t('store.storeCode')}</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.dark ? '#38383A' : '#E5E5EA' }]}
                    placeholder={t('store.storeCodePlaceholder')}
                    placeholderTextColor={theme.dark ? '#98989D' : '#999'}
                    value={joinCode}
                    onChangeText={setJoinCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>{t('store.nickname')}</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.dark ? '#38383A' : '#E5E5EA' }]}
                    placeholder={t('store.nicknamePlaceholder')}
                    placeholderTextColor={theme.dark ? '#98989D' : '#999'}
                    value={joinNickname}
                    onChangeText={setJoinNickname}
                    autoCapitalize="words"
                  />
                </View>
                
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: theme.dark ? '#38383A' : '#E5E5EA' }]}
                    onPress={() => {
                      setShowJoinForm(false);
                      setJoinCode('');
                      setJoinNickname('');
                    }}
                    disabled={isJoining}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleJoinStore}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>{t('store.join')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </GlassView>
            )}
          </>
        ) : (
          <>
            <GlassView style={styles.storeHeader} glassEffectStyle="regular">
              <View style={styles.storeHeaderTop}>
                <IconSymbol ios_icon_name="storefront.fill" android_material_icon_name="store" size={40} color={colors.primary} />
                <TouchableOpacity onPress={handleOpenSettings}>
                  <IconSymbol ios_icon_name="gearshape.fill" android_material_icon_name="settings" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.storeName, { color: theme.colors.text }]}>{currentStore.name}</Text>
              <Text style={[styles.storeRole, { color: theme.dark ? '#98989D' : '#666' }]}>
                {currentStore.role === 'admin' ? t('store.admin') : t('store.staff')} • {currentStore.nickname}
              </Text>
              
              <View style={styles.codeContainer}>
                <Text style={[styles.codeLabel, { color: theme.dark ? '#98989D' : '#666' }]}>{t('store.storeCode')}</Text>
                <Text style={[styles.codeValue, { color: theme.colors.text }]}>{currentStore.storeCode}</Text>
              </View>
              
              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={[styles.codeButton, { backgroundColor: colors.primary }]}
                  onPress={handleShareCode}
                >
                  <IconSymbol ios_icon_name="square.and.arrow.up" android_material_icon_name="share" size={20} color="#fff" />
                  <Text style={styles.codeButtonText}>{t('store.shareCode')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.codeButton, { backgroundColor: colors.primary }]}
                  onPress={handleShowQR}
                >
                  <IconSymbol ios_icon_name="qrcode" android_material_icon_name="qr-code" size={20} color="#fff" />
                  <Text style={styles.codeButtonText}>{t('store.showQR')}</Text>
                </TouchableOpacity>
              </View>
            </GlassView>
            
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('store.members')}</Text>
              <Text style={[styles.memberCount, { color: theme.dark ? '#98989D' : '#666' }]}>{members.length}</Text>
            </View>
            
            <GlassView style={styles.membersContainer} glassEffectStyle="regular">
              {members.map((member, index) => (
                <React.Fragment key={member.id}>
                  <View style={styles.memberItem}>
                    <View style={styles.memberInfo}>
                      <IconSymbol
                        ios_icon_name={member.role === 'admin' ? 'crown.fill' : 'person.fill'}
                        android_material_icon_name={member.role === 'admin' ? 'star' : 'person'}
                        size={24}
                        color={member.role === 'admin' ? colors.primary : theme.dark ? '#98989D' : '#666'}
                      />
                      <View style={styles.memberDetails}>
                        <Text style={[styles.memberNickname, { color: theme.colors.text }]}>{member.nickname}</Text>
                        <Text style={[styles.memberRole, { color: theme.dark ? '#98989D' : '#666' }]}>
                          {member.role === 'admin' ? t('store.admin') : t('store.staff')} • {formatDate(member.joinedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {index < members.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: theme.dark ? '#38383A' : '#E5E5EA' }]} />
                  )}
                </React.Fragment>
              ))}
            </GlassView>
            
            <View style={styles.storeActions}>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.primary }]}
                onPress={handleSwitchStore}
              >
                <IconSymbol ios_icon_name="arrow.left.arrow.right" android_material_icon_name="swap-horiz" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>{t('store.switchStore')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: theme.dark ? '#98989D' : '#666' }]}
                onPress={handleLeaveStore}
              >
                <IconSymbol ios_icon_name="rectangle.portrait.and.arrow.right" android_material_icon_name="exit-to-app" size={20} color={theme.dark ? '#98989D' : '#666'} />
                <Text style={[styles.actionButtonText, { color: theme.dark ? '#98989D' : '#666' }]}>{t('store.leaveStore')}</Text>
              </TouchableOpacity>
              
              {currentStore.role === 'admin' && (
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.error }]}
                  onPress={handleDeleteStore}
                >
                  <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color={colors.error} />
                  <Text style={[styles.actionButtonText, { color: colors.error }]}>{t('store.deleteStore')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
      
      <Modal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
        onConfirm={modalOnConfirm}
      />
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  storeHeader: {
    borderRadius: 12,
    padding: 20,
    gap: 12,
    marginBottom: 24,
  },
  storeHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  storeRole: {
    fontSize: 16,
  },
  codeContainer: {
    marginTop: 8,
    gap: 4,
  },
  codeLabel: {
    fontSize: 14,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  codeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  codeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 16,
  },
  membersContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  memberItem: {
    paddingVertical: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberNickname: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  storeActions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
