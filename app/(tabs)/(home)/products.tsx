
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getExpiryBatches, deleteExpiryBatch, type ExpiryBatch } from '@/utils/api';
import { useStore } from '@/app/_layout';
import Modal from '@/components/ui/Modal';

interface GroupedBatch {
  barcode: string;
  expiryDate: string;
  productName?: string;
  primaryImageUrl?: string;
  totalQuantity: number;
  batches: ExpiryBatch[];
  status?: 'fresh' | 'expiring' | 'expired';
}

export default function ProductsScreen() {
  const router = useRouter();
  const { currentStore } = useStore();
  const [entries, setEntries] = useState<ExpiryBatch[]>([]);
  const [groupedEntries, setGroupedEntries] = useState<GroupedBatch[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<GroupedBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'fresh' | 'expiring' | 'expired'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    onConfirm: undefined as (() => void) | undefined,
  });

  useEffect(() => {
    console.log('ProductsScreen: Loading products');
    loadProducts();
  }, [currentStore?.id]);

  useEffect(() => {
    // Group entries by barcode + expiry_date
    const grouped = groupBatches(entries);
    setGroupedEntries(grouped);
  }, [entries]);

  useEffect(() => {
    filterProducts();
  }, [groupedEntries, searchQuery, filterStatus]);

  const groupBatches = (batches: ExpiryBatch[]): GroupedBatch[] => {
    const groups = new Map<string, GroupedBatch>();

    batches.forEach(batch => {
      const key = `${batch.barcode}_${batch.expiryDate}`;
      
      if (groups.has(key)) {
        const existing = groups.get(key)!;
        existing.totalQuantity += batch.quantity;
        existing.batches.push(batch);
      } else {
        groups.set(key, {
          barcode: batch.barcode,
          expiryDate: batch.expiryDate,
          productName: batch.productName,
          primaryImageUrl: batch.primaryImageUrl,
          totalQuantity: batch.quantity,
          batches: [batch],
          status: batch.status,
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      // Sort by expiry date (earliest first)
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
  };

  const loadProducts = async () => {
    if (!currentStore?.id) {
      console.log('ProductsScreen: No store linked');
      setEntries([]);
      setLoading(false);
      return;
    }

    console.log('ProductsScreen: Fetching expiry batches for store:', currentStore.id);
    setLoading(true);
    try {
      const data = await getExpiryBatches({ store_id: currentStore.id, status: 'all' });
      console.log('ProductsScreen: Loaded', data.length, 'batches');
      setEntries(data);
    } catch (error) {
      console.error('ProductsScreen: Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = groupedEntries;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(entry => entry.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.productName?.toLowerCase().includes(query) ||
        entry.barcode.includes(query)
      );
    }

    setFilteredEntries(filtered);
  };

  const confirmDelete = (group: GroupedBatch) => {
    const productName = group.productName || group.barcode;
    const batchCount = group.batches.length;
    setModalConfig({
      title: 'Delete Expiry Batch',
      message: `Are you sure you want to delete ${batchCount} batch${batchCount > 1 ? 'es' : ''} of "${productName}" expiring on ${formatDate(group.expiryDate)}? This cannot be undone.`,
      type: 'warning',
      onConfirm: () => handleDelete(group),
    });
    setModalVisible(true);
  };

  const handleDelete = async (group: GroupedBatch) => {
    if (!currentStore?.id) return;

    console.log('ProductsScreen: Deleting batches:', group.batches.length);
    setModalVisible(false);
    setDeletingId(group.barcode + group.expiryDate);
    
    try {
      // Delete all batches in this group
      await Promise.all(
        group.batches.map(batch => deleteExpiryBatch(batch.id, currentStore.id))
      );
      console.log('ProductsScreen: Batches deleted successfully');
      
      // Remove from local state
      const batchIds = group.batches.map(b => b.id);
      setEntries(prev => prev.filter(entry => !batchIds.includes(entry.id)));
      
      // Show success message
      setModalConfig({
        title: 'Deleted',
        message: 'Expiry batch has been deleted successfully.',
        type: 'success',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } catch (error) {
      console.error('ProductsScreen: Error deleting batches:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to delete expiry batch. Please try again.',
        type: 'error',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'fresh') return '#10B981';
    if (status === 'expiring') return '#F59E0B';
    if (status === 'expired') return '#EF4444';
    return colors.textSecondary;
  };

  const getStatusText = (status: string) => {
    if (status === 'fresh') return 'Fresh';
    if (status === 'expiring') return 'Expiring Soon';
    if (status === 'expired') return 'Expired';
    return status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const getDaysUntilExpiration = (dateString: string) => {
    const expDate = new Date(dateString);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onConfirm ? () => setModalVisible(false) : undefined}
        confirmText={modalConfig.onConfirm ? 'Delete' : 'OK'}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Products</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
              All ({groupedEntries.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'fresh' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('fresh')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'fresh' && styles.filterButtonTextActive]}>
              Fresh ({groupedEntries.filter(e => e.status === 'fresh').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'expiring' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('expiring')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'expiring' && styles.filterButtonTextActive]}>
              Expiring ({groupedEntries.filter(e => e.status === 'expiring').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'expired' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('expired')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'expired' && styles.filterButtonTextActive]}>
              Expired ({groupedEntries.filter(e => e.status === 'expired').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : filteredEntries.length === 0 ? (
        <View style={styles.centerContent}>
          <IconSymbol ios_icon_name="tray" android_material_icon_name="inbox" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No results found' : 'No products yet'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try a different search term' : 'Start scanning barcodes to track products'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {filteredEntries.map((group) => {
            const statusColor = getStatusColor(group.status || 'fresh');
            const statusText = getStatusText(group.status || 'fresh');
            const formattedDate = formatDate(group.expiryDate);
            const daysUntil = getDaysUntilExpiration(group.expiryDate);
            const isDeleting = deletingId === (group.barcode + group.expiryDate);
            const productName = group.productName || group.barcode;

            return (
              <View key={`${group.barcode}_${group.expiryDate}`} style={styles.productCard}>
                {group.primaryImageUrl && (
                  <Image source={{ uri: group.primaryImageUrl }} style={styles.productImage} resizeMode="cover" />
                )}
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <View style={styles.productTitleRow}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={styles.productName} numberOfLines={1}>
                        {productName}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => confirmDelete(group)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color="#EF4444" />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.productDetails}>
                    <View style={styles.detailRow}>
                      <IconSymbol ios_icon_name="barcode" android_material_icon_name="qr-code" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{group.barcode}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>
                        Expires: {formattedDate}
                        {daysUntil >= 0 ? ` (${daysUntil} days)` : ` (${Math.abs(daysUntil)} days ago)`}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol ios_icon_name="inventory" android_material_icon_name="inventory" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>Total Quantity: {group.totalQuantity}</Text>
                    </View>
                    {group.batches.length > 1 && (
                      <View style={styles.detailRow}>
                        <IconSymbol ios_icon_name="tray.fill" android_material_icon_name="layers" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{group.batches.length} batches</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.statusBadgeContainer}>
                    <Text style={[styles.statusBadge, { color: statusColor }]}>{statusText}</Text>
                  </View>
                </View>
              </View>
            );
          })}
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  productCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.backgroundAlt,
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  productDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  notesContainer: {
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  statusBadgeContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
  },
});
