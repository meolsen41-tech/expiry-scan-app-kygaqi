
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { IconSymbol } from '@/components/IconSymbol';
import Modal from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import {
  createBatchScan,
  getBatchScans,
  addBatchScanItem,
  getBatchScanItems,
  completeBatchScan,
  deleteBatchScan,
  type BatchScan,
  type BatchScanItem,
} from '@/utils/batchScanning';
import { getDeviceId } from '@/utils/deviceId';
import { getProductByBarcode } from '@/utils/api';

export default function BatchScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [deviceId, setDeviceId] = useState<string>('');
  const [batches, setBatches] = useState<BatchScan[]>([]);
  const [currentBatch, setCurrentBatch] = useState<BatchScan | null>(null);
  const [batchItems, setBatchItems] = useState<BatchScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  
  // Form state
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [showItemForm, setShowItemForm] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    onConfirm: undefined as (() => void) | undefined,
  });

  useEffect(() => {
    loadData();
    requestPermission();
  }, []);

  useEffect(() => {
    if (params.batchId && typeof params.batchId === 'string') {
      loadBatchItems(params.batchId);
    }
  }, [params.batchId]);

  const loadData = async () => {
    console.log('[BatchScan] Loading data');
    setLoading(true);
    try {
      const id = await getDeviceId();
      setDeviceId(id);
      
      const loadedBatches = await getBatchScans(id);
      setBatches(loadedBatches);
      
      // If there's an active batch, load it
      const activeBatch = loadedBatches.find(b => b.status === 'in_progress');
      if (activeBatch) {
        setCurrentBatch(activeBatch);
        await loadBatchItems(activeBatch.id);
      }
    } catch (error) {
      console.error('[BatchScan] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchItems = async (batchId: string) => {
    console.log('[BatchScan] Loading batch items:', batchId);
    try {
      const items = await getBatchScanItems(batchId);
      setBatchItems(items);
      
      // Update current batch
      const batch = batches.find(b => b.id === batchId);
      if (batch) {
        setCurrentBatch(batch);
      }
    } catch (error) {
      console.error('[BatchScan] Error loading batch items:', error);
    }
  };

  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) {
      setModalConfig({
        title: 'Missing Name',
        message: 'Please enter a batch name.',
        type: 'warning',
        onConfirm: undefined,
      });
      setModalVisible(true);
      return;
    }

    console.log('[BatchScan] Creating batch:', newBatchName);
    setLoading(true);
    try {
      const batch = await createBatchScan(deviceId, newBatchName);
      setCurrentBatch(batch);
      setBatches([batch, ...batches]);
      setBatchItems([]);
      setNewBatchName('');
      setShowNewBatchForm(false);
      
      setModalConfig({
        title: 'Batch Created',
        message: `Batch "${batch.batchName}" is ready for scanning.`,
        type: 'success',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } catch (error) {
      console.error('[BatchScan] Error creating batch:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to create batch.',
        type: 'error',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    
    console.log('[BatchScan] Barcode scanned:', data);
    setScanned(true);
    setBarcode(data);
    setScanning(false);
    setShowItemForm(true);

    // Look up product
    try {
      const product = await getProductByBarcode(data);
      if (product) {
        setProductName(product.name);
        setCategory(product.category || '');
      }
    } catch (error) {
      console.error('[BatchScan] Error looking up product:', error);
    }
  };

  const handleAddItem = async () => {
    if (!currentBatch || !barcode || !productName || !expirationDate) {
      setModalConfig({
        title: 'Missing Information',
        message: 'Please fill in barcode, product name, and expiration date.',
        type: 'warning',
        onConfirm: undefined,
      });
      setModalVisible(true);
      return;
    }

    console.log('[BatchScan] Adding item to batch');
    setLoading(true);
    try {
      const result = await addBatchScanItem(currentBatch.id, {
        barcode,
        productName,
        expirationDate,
        category: category || undefined,
        quantity: parseInt(quantity) || 1,
      });
      
      // Update batch items
      setBatchItems([result.item, ...batchItems]);
      
      // Update batch count
      setCurrentBatch({
        ...currentBatch,
        itemCount: result.batchItemCount,
      });
      
      // Reset form
      resetItemForm();
      
      // Show success and continue scanning
      setModalConfig({
        title: 'Item Added',
        message: `Added ${productName} to batch. Scan next item.`,
        type: 'success',
        onConfirm: undefined,
      });
      setModalVisible(true);
      
      // Auto-start scanning again
      setTimeout(() => {
        setScanning(true);
      }, 1000);
    } catch (error) {
      console.error('[BatchScan] Error adding item:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to add item to batch.',
        type: 'error',
        onConfirm: undefined,
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBatch = async () => {
    if (!currentBatch) return;

    setModalConfig({
      title: 'Complete Batch?',
      message: `This will create ${currentBatch.itemCount} product entries. Continue?`,
      type: 'warning',
      onConfirm: async () => {
        console.log('[BatchScan] Completing batch');
        setLoading(true);
        try {
          const result = await completeBatchScan(currentBatch.id);
          
          setModalConfig({
            title: 'Batch Completed',
            message: `Created ${result.entriesCreated} product entries successfully.`,
            type: 'success',
            onConfirm: undefined,
          });
          setModalVisible(true);
          
          // Reload data
          await loadData();
          setCurrentBatch(null);
          setBatchItems([]);
        } catch (error) {
          console.error('[BatchScan] Error completing batch:', error);
          setModalConfig({
            title: 'Error',
            message: 'Failed to complete batch.',
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

  const handleDeleteBatch = async (batchId: string) => {
    setModalConfig({
      title: 'Delete Batch?',
      message: 'This will delete the batch and all its items. This cannot be undone.',
      type: 'error',
      onConfirm: async () => {
        console.log('[BatchScan] Deleting batch:', batchId);
        setLoading(true);
        try {
          await deleteBatchScan(batchId);
          
          // Reload data
          await loadData();
          if (currentBatch?.id === batchId) {
            setCurrentBatch(null);
            setBatchItems([]);
          }
          
          setModalConfig({
            title: 'Batch Deleted',
            message: 'Batch has been deleted successfully.',
            type: 'success',
            onConfirm: undefined,
          });
          setModalVisible(true);
        } catch (error) {
          console.error('[BatchScan] Error deleting batch:', error);
          setModalConfig({
            title: 'Error',
            message: 'Failed to delete batch.',
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

  const resetItemForm = () => {
    setBarcode('');
    setProductName('');
    setExpirationDate('');
    setCategory('');
    setQuantity('1');
    setShowItemForm(false);
    setScanned(false);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading && batches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading batch scans...</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Batch Scanning</Text>
        <View style={{ width: 40 }} />
      </View>

      {scanning && permission?.granted ? (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.scanArea} />
              <Text style={styles.scanText}>Scan barcode</Text>
              <Text style={styles.scanSubtext}>
                {currentBatch ? `Batch: ${currentBatch.batchName} (${currentBatch.itemCount} items)` : ''}
              </Text>
            </View>
          </CameraView>
          <TouchableOpacity style={styles.cancelScanButton} onPress={() => setScanning(false)}>
            <Text style={styles.cancelScanText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : showItemForm ? (
        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
          <Text style={styles.formTitle}>Add Item to Batch</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barcode *</Text>
            <TextInput
              style={styles.input}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Barcode"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="Product name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expiration Date *</Text>
            <TextInput
              style={styles.input}
              value={expirationDate}
              onChangeText={setExpirationDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="Optional"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={resetItemForm}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, loading && styles.buttonDisabled]}
              onPress={handleAddItem}
              disabled={loading}
            >
              <Text style={styles.addButtonText}>
                {loading ? 'Adding...' : 'Add Item'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {currentBatch ? (
            <>
              <View style={styles.currentBatchCard}>
                <View style={styles.batchHeader}>
                  <View style={styles.batchInfo}>
                    <Text style={styles.batchName}>{currentBatch.batchName}</Text>
                    <Text style={styles.batchCount}>{currentBatch.itemCount} items</Text>
                  </View>
                  <View style={styles.batchActions}>
                    <TouchableOpacity
                      style={styles.scanButton}
                      onPress={() => setScanning(true)}
                    >
                      <IconSymbol ios_icon_name="barcode.viewfinder" android_material_icon_name="qr-code-scanner" size={24} color="#FFFFFF" />
                      <Text style={styles.scanButtonText}>Scan</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {batchItems.length > 0 && (
                  <View style={styles.itemsList}>
                    <Text style={styles.itemsTitle}>Items in Batch</Text>
                    {batchItems.map((item) => {
                      const formattedDate = formatDate(item.expirationDate);
                      return (
                        <View key={item.id} style={styles.itemCard}>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{item.productName}</Text>
                            <Text style={styles.itemDetails}>
                              Expires: {formattedDate} • Qty: {item.quantity}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.batchButtons}>
                  <TouchableOpacity
                    style={[styles.completeButton, currentBatch.itemCount === 0 && styles.buttonDisabled]}
                    onPress={handleCompleteBatch}
                    disabled={currentBatch.itemCount === 0 || loading}
                  >
                    <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.completeButtonText}>Complete Batch</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteBatch(currentBatch.id)}
                    disabled={loading}
                  >
                    <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              {!showNewBatchForm ? (
                <View style={styles.emptyState}>
                  <IconSymbol ios_icon_name="tray.fill" android_material_icon_name="inventory" size={64} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No Active Batch</Text>
                  <Text style={styles.emptySubtext}>Create a batch to start scanning multiple items</Text>
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setShowNewBatchForm(true)}
                  >
                    <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Create Batch</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.newBatchForm}>
                  <Text style={styles.formTitle}>Create New Batch</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Batch Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={newBatchName}
                      onChangeText={setNewBatchName}
                      placeholder="e.g., Morning Stock Check"
                      placeholderTextColor={colors.textSecondary}
                      autoFocus
                    />
                  </View>
                  <View style={styles.formButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowNewBatchForm(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addButton, loading && styles.buttonDisabled]}
                      onPress={handleCreateBatch}
                      disabled={loading}
                    >
                      <Text style={styles.addButtonText}>
                        {loading ? 'Creating...' : 'Create'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {batches.filter(b => b.status === 'completed').length > 0 && (
                <View style={styles.historySection}>
                  <Text style={styles.historyTitle}>Completed Batches</Text>
                  {batches
                    .filter(b => b.status === 'completed')
                    .map((batch) => {
                      const completedDate = batch.completedAt ? formatDate(batch.completedAt) : 'Unknown';
                      return (
                        <View key={batch.id} style={styles.historyCard}>
                          <View style={styles.historyInfo}>
                            <Text style={styles.historyName}>{batch.batchName}</Text>
                            <Text style={styles.historyDetails}>
                              {batch.itemCount} items • Completed {completedDate}
                            </Text>
                          </View>
                          <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color="#10B981" />
                        </View>
                      );
                    })}
                </View>
              )}
            </>
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
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
  },
  scanSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  cancelScanButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelScanText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  currentBatchCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  batchCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  batchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemsList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  batchButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  newBatchForm: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 100,
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
  addButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  historySection: {
    marginTop: 32,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  historyDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
