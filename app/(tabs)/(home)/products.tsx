
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getProductEntries, deleteProductEntry, type ProductEntry } from '@/utils/api';
import Modal from '@/components/ui/Modal';

export default function ProductsScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<ProductEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ProductEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'fresh' | 'expiring_soon' | 'expired'>('all');
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
  }, []);

  useEffect(() => {
    filterProducts();
  }, [entries, searchQuery, filterStatus]);

  const loadProducts = async () => {
    console.log('ProductsScreen: Fetching product entries');
    setLoading(true);
    try {
      const data = await getProductEntries();
      console.log('ProductsScreen: Loaded', data.length, 'entries');
      setEntries(data);
    } catch (error) {
      console.error('ProductsScreen: Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = entries;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(entry => entry.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.productName.toLowerCase().includes(query) ||
        entry.barcode.includes(query) ||
        entry.category?.toLowerCase().includes(query)
      );
    }

    setFilteredEntries(filtered);
  };

  const confirmDelete = (id: string, productName: string) => {
    setModalConfig({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      type: 'warning',
      onConfirm: () => handleDelete(id),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    console.log('ProductsScreen: Deleting entry:', id);
    setModalVisible(false);
    setDeletingId(id);
    try {
      await deleteProductEntry(id);
      console.log('ProductsScreen: Entry deleted successfully');
      // Remove from local state
      setEntries(prev => prev.filter(entry => entry.id !== id));
      
      // Show success message
      setModalConfig({
        title: 'Deleted',
        message: 'Product has been deleted successfully.',
        type: 'success',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } catch (error) {
      console.error('ProductsScreen: Error deleting entry:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to delete product. Please try again.',
        type: 'error',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'fresh') return colors.fresh;
    if (status === 'expiring_soon') return colors.expiringSoon;
    if (status === 'expired') return colors.expired;
    return colors.textSecondary;
  };

  const getStatusText = (status: string) => {
    if (status === 'fresh') return 'Fresh';
    if (status === 'expiring_soon') return 'Expiring Soon';
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
              All ({entries.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'fresh' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('fresh')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'fresh' && styles.filterButtonTextActive]}>
              Fresh ({entries.filter(e => e.status === 'fresh').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'expiring_soon' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('expiring_soon')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'expiring_soon' && styles.filterButtonTextActive]}>
              Expiring ({entries.filter(e => e.status === 'expiring_soon').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'expired' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('expired')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'expired' && styles.filterButtonTextActive]}>
              Expired ({entries.filter(e => e.status === 'expired').length})
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
          {filteredEntries.map((entry) => {
            const statusColor = getStatusColor(entry.status);
            const statusText = getStatusText(entry.status);
            const formattedDate = formatDate(entry.expirationDate);
            const daysUntil = getDaysUntilExpiration(entry.expirationDate);
            const isDeleting = deletingId === entry.id;

            return (
              <View key={entry.id} style={styles.productCard}>
                {entry.imageUrl && (
                  <Image source={{ uri: entry.imageUrl }} style={styles.productImage} resizeMode="cover" />
                )}
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <View style={styles.productTitleRow}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={styles.productName} numberOfLines={1}>
                        {entry.productName}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => confirmDelete(entry.id, entry.productName)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color={colors.expired} />
                      ) : (
                        <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color={colors.expired} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.productDetails}>
                    <View style={styles.detailRow}>
                      <IconSymbol ios_icon_name="barcode" android_material_icon_name="qr-code" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{entry.barcode}</Text>
                    </View>
                    {entry.category && (
                      <View style={styles.detailRow}>
                        <IconSymbol ios_icon_name="tag.fill" android_material_icon_name="label" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{entry.category}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>
                        Expires: {formattedDate}
                        {daysUntil >= 0 ? ` (${daysUntil} days)` : ` (${Math.abs(daysUntil)} days ago)`}
                      </Text>
                    </View>
                    {entry.location && (
                      <View style={styles.detailRow}>
                        <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{entry.location}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <IconSymbol ios_icon_name="number" android_material_icon_name="tag" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>Quantity: {entry.quantity}</Text>
                    </View>
                  </View>

                  {entry.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesText}>{entry.notes}</Text>
                    </View>
                  )}

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
