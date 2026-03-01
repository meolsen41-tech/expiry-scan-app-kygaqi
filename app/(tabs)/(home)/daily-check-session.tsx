
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Platform, ActivityIndicator, Image, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import Modal from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import { useStore } from '@/app/_layout';
import {
  getDailyCheckProducts,
  recordDailyCheckAction,
  completeDailyCheckSession,
  type DailyCheckProduct,
  type DailyCheckSession,
} from '@/utils/api';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function DailyCheckSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<DailyCheckProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState({
    totalChecked: 0,
    totalDiscounted: 0,
    totalSold: 0,
    totalDiscarded: 0,
    totalSkipped: 0,
  });
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

  const sessionId = params.sessionId as string;

  useEffect(() => {
    loadProducts();
  }, [sessionId]);

  const loadProducts = async () => {
    console.log('[DailyCheckSession] Loading products for session:', sessionId);
    if (!sessionId) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      const data = await getDailyCheckProducts(sessionId);
      setProducts(data);
      console.log('[DailyCheckSession] Loaded products:', data.length);
      
      if (data.length === 0) {
        setShowSummary(true);
      }
    } catch (error: any) {
      console.error('[DailyCheckSession] Error loading products:', error);
      showModal('error', 'Error', error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setModalState({ visible: true, type, title, message });
  };

  const handleAction = async (actionType: 'checked' | 'discounted' | 'sold' | 'discarded' | 'skipped') => {
    console.log('[DailyCheckSession] Recording action:', actionType);
    if (!currentStore?.memberId || currentIndex >= products.length) {
      return;
    }

    const currentProduct = products[currentIndex];
    setProcessing(true);

    try {
      await recordDailyCheckAction({
        sessionId,
        expiryBatchId: currentProduct.id,
        actionType,
        memberId: currentStore.memberId,
      });

      console.log('[DailyCheckSession] Action recorded:', actionType);

      const newSummary = { ...summary };
      if (actionType === 'checked') newSummary.totalChecked++;
      if (actionType === 'discounted') newSummary.totalDiscounted++;
      if (actionType === 'sold') newSummary.totalSold++;
      if (actionType === 'discarded') newSummary.totalDiscarded++;
      if (actionType === 'skipped') newSummary.totalSkipped++;
      setSummary(newSummary);

      if (currentIndex + 1 >= products.length) {
        setShowSummary(true);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error: any) {
      console.error('[DailyCheckSession] Error recording action:', error);
      showModal('error', 'Error', error.message || 'Failed to record action');
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    console.log('[DailyCheckSession] Completing session');
    setProcessing(true);

    try {
      await completeDailyCheckSession(sessionId);
      console.log('[DailyCheckSession] Session completed');
      router.back();
    } catch (error: any) {
      console.error('[DailyCheckSession] Error completing session:', error);
      showModal('error', 'Error', error.message || 'Failed to complete session');
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'fresh':
        return '#10B981';
      case 'expiring':
        return '#F59E0B';
      case 'expired':
        return '#EF4444';
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Check</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showSummary) {
    const totalProcessed = summary.totalChecked + summary.totalDiscounted + summary.totalSold + summary.totalDiscarded;
    
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Check Complete</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryIcon}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={80} color="#10B981" />
          </View>

          <Text style={styles.summaryTitle}>Daily Check Completed!</Text>
          <Text style={styles.summarySubtitle}>Here&apos;s your summary</Text>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStatCard}>
              <Text style={styles.summaryStatValue}>{totalProcessed}</Text>
              <Text style={styles.summaryStatLabel}>Total Processed</Text>
            </View>
          </View>

          <View style={styles.summaryDetails}>
            <View style={styles.summaryDetailRow}>
              <View style={styles.summaryDetailIcon}>
                <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={20} color="#10B981" />
              </View>
              <Text style={styles.summaryDetailLabel}>Checked</Text>
              <Text style={styles.summaryDetailValue}>{summary.totalChecked}</Text>
            </View>

            <View style={styles.summaryDetailRow}>
              <View style={styles.summaryDetailIcon}>
                <IconSymbol ios_icon_name="tag.fill" android_material_icon_name="local-offer" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.summaryDetailLabel}>Discounted</Text>
              <Text style={styles.summaryDetailValue}>{summary.totalDiscounted}</Text>
            </View>

            <View style={styles.summaryDetailRow}>
              <View style={styles.summaryDetailIcon}>
                <IconSymbol ios_icon_name="cart.fill" android_material_icon_name="shopping-cart" size={20} color="#10B981" />
              </View>
              <Text style={styles.summaryDetailLabel}>Sold</Text>
              <Text style={styles.summaryDetailValue}>{summary.totalSold}</Text>
            </View>

            <View style={styles.summaryDetailRow}>
              <View style={styles.summaryDetailIcon}>
                <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color="#EF4444" />
              </View>
              <Text style={styles.summaryDetailLabel}>Discarded</Text>
              <Text style={styles.summaryDetailValue}>{summary.totalDiscarded}</Text>
            </View>

            <View style={styles.summaryDetailRow}>
              <View style={styles.summaryDetailIcon}>
                <IconSymbol ios_icon_name="arrow.right" android_material_icon_name="arrow-forward" size={20} color={colors.textSecondary} />
              </View>
              <Text style={styles.summaryDetailLabel}>Skipped</Text>
              <Text style={styles.summaryDetailValue}>{summary.totalSkipped}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.completeButtonText}>Avslutt sjekkemodus</Text>
            )}
          </TouchableOpacity>
        </View>

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

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Check</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol ios_icon_name="checkmark.circle" android_material_icon_name="check-circle" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No Products to Check</Text>
          <Text style={styles.emptySubtext}>All products have been checked or there are no products expiring soon</Text>
          <TouchableOpacity style={styles.backToHomeButton} onPress={() => router.back()}>
            <Text style={styles.backToHomeButtonText}>Back to Daily Check</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentProduct = products[currentIndex];
  const progress = ((currentIndex + 1) / products.length) * 100;
  const expiryDate = formatDate(currentProduct.expiryDate);
  const statusColor = getStatusColor(currentProduct.status || 'fresh');
  const productName = currentProduct.productName || currentProduct.barcode;
  const barcode = currentProduct.barcode;
  const quantityText = `${currentProduct.quantity}x`;

  let statusLabel = 'Fresh';
  if (currentProduct.status === 'expired') statusLabel = 'EXPIRED';
  else if (currentProduct.status === 'expiring') statusLabel = 'Expiring Soon';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Check</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{currentIndex + 1} / {products.length}</Text>
      </View>

      <View style={styles.productContainer}>
        {currentProduct.primaryImageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={resolveImageSource(currentProduct.primaryImageUrl)}
              style={styles.productImage}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{productName}</Text>
          <Text style={styles.productBarcode}>{barcode}</Text>
          
          <View style={styles.expiryContainer}>
            <View style={[styles.expiryBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.expiryLabel}>Expiry Date</Text>
              <Text style={styles.expiryDate}>{expiryDate}</Text>
            </View>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>{quantityText}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>What would you like to do?</Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonChecked]}
          onPress={() => handleAction('checked')}
          disabled={processing}
        >
          <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Sjekket</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDiscounted]}
          onPress={() => handleAction('discounted')}
          disabled={processing}
        >
          <IconSymbol ios_icon_name="tag.fill" android_material_icon_name="local-offer" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Nedsatt pris</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSold]}
          onPress={() => handleAction('sold')}
          disabled={processing}
        >
          <IconSymbol ios_icon_name="cart.fill" android_material_icon_name="shopping-cart" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Solgt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDiscarded]}
          onPress={() => handleAction('discarded')}
          disabled={processing}
        >
          <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Kassert</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSkip]}
          onPress={() => handleAction('skipped')}
          disabled={processing}
        >
          <IconSymbol ios_icon_name="arrow.right" android_material_icon_name="arrow-forward" size={24} color={colors.text} />
          <Text style={[styles.actionButtonText, styles.actionButtonTextSkip]}>Hopp over</Text>
        </TouchableOpacity>
      </View>

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
  headerLeft: {
    width: 32,
  },
  headerRight: {
    width: 32,
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
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  backToHomeButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  backToHomeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.card,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  productContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    gap: 12,
  },
  productName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  productBarcode: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  expiryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  expiryBadge: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  expiryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quantityBadge: {
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonChecked: {
    backgroundColor: '#10B981',
  },
  actionButtonDiscounted: {
    backgroundColor: '#F59E0B',
  },
  actionButtonSold: {
    backgroundColor: '#3B82F6',
  },
  actionButtonDiscarded: {
    backgroundColor: '#EF4444',
  },
  actionButtonSkip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonTextSkip: {
    color: colors.text,
  },
  summaryContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 100,
    alignItems: 'center',
  },
  summaryIcon: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  summaryStats: {
    width: '100%',
    marginBottom: 32,
  },
  summaryStatCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  summaryStatLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryDetails: {
    width: '100%',
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 32,
    gap: 16,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDetailLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  summaryDetailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  completeButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
