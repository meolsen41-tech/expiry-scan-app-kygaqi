
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getProductByBarcode, createProduct, uploadProductImage, createExpiryBatch, uploadImage, getProductImages, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/api';
import Modal from '@/components/ui/Modal';
import { useStore } from '@/app/_layout';

export default function ScannerScreen() {
  const router = useRouter();
  const { currentStore } = useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [allImages, setAllImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingBBD, setAnalyzingBBD] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [needsProductInfo, setNeedsProductInfo] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'error' as 'info' | 'success' | 'warning' | 'error',
  });

  useEffect(() => {
    console.log('ScannerScreen: Requesting camera permissions');
    requestPermission();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    
    console.log('ScannerScreen: Barcode scanned:', data);
    setScanned(true);
    setBarcode(data);
    setShowForm(true);

    // Look up product by barcode
    setLoading(true);
    try {
      const product = await getProductByBarcode(data);
      if (product) {
        console.log('ScannerScreen: Product found:', product);
        setProductName(product.name || '');
        setPrimaryImageUrl(product.primaryImageUrl || null);
        setNeedsProductInfo(!product.name || !product.primaryImageUrl);
        
        // Fetch all images for this product
        try {
          const images = await getProductImages(data);
          setAllImages(images);
          console.log('ScannerScreen: Product images loaded:', images.length);
        } catch (error) {
          console.log('ScannerScreen: No images found for product');
        }
      } else {
        console.log('ScannerScreen: Product not found, manual entry required');
        setNeedsProductInfo(true);
      }
    } catch (error) {
      console.error('ScannerScreen: Error looking up product:', error);
      setNeedsProductInfo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualBarcodeEntry = () => {
    console.log('ScannerScreen: Manual barcode entry');
    setShowForm(true);
    setScanned(true);
  };

  const handlePickImage = async () => {
    console.log('ScannerScreen: Picking image');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      console.log('ScannerScreen: Image selected:', result.assets[0].uri);
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    console.log('ScannerScreen: Taking photo');
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      console.log('ScannerScreen: Photo taken:', result.assets[0].uri);
      setImageUri(result.assets[0].uri);
    }
  };

  const handleScanBBD = async () => {
    console.log('ScannerScreen: Scanning BBD');
    
    // Take a photo
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const photoUri = result.assets[0].uri;
    console.log('ScannerScreen: BBD photo taken:', photoUri);

    setAnalyzingBBD(true);
    setModalConfig({
      title: 'Analyzing Date',
      message: 'Reading the expiration date from the photo...',
      type: 'info',
    });
    setModalVisible(true);

    try {
      // Create form data
      const formData = new FormData();
      const filename = photoUri.split('/').pop() || 'bbd.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: photoUri,
        name: filename,
        type,
      } as any);

      // Call the BBD analysis endpoint
      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-bbd-image`, {
        method: 'POST',
        body: formData,
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      const data = await response.json();
      console.log('ScannerScreen: BBD analysis result:', data);

      if (data.success && data.expiryDate) {
        setExpirationDate(data.expiryDate);
        setModalConfig({
          title: 'Date Found!',
          message: `Expiration date detected: ${data.expiryDate}`,
          type: 'success',
        });
        setModalVisible(true);
        setTimeout(() => setModalVisible(false), 2000);
      } else {
        setModalConfig({
          title: 'Date Not Found',
          message: data.error || 'Could not read the date from the photo. Please enter it manually.',
          type: 'warning',
        });
        setModalVisible(true);
      }
    } catch (error: any) {
      console.error('ScannerScreen: Error analyzing BBD:', error);
      setModalConfig({
        title: 'Analysis Failed',
        message: 'Failed to analyze the photo. Please enter the date manually.',
        type: 'error',
      });
      setModalVisible(true);
    } finally {
      setAnalyzingBBD(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!barcode || !expirationDate || !quantity) {
      console.log('ScannerScreen: Missing required fields');
      setModalConfig({
        title: 'Missing Information',
        message: 'Please fill in: Barcode, Expiration Date (YYYY-MM), and Quantity.',
        type: 'warning',
      });
      setModalVisible(true);
      return;
    }

    // Validate date format (YYYY-MM)
    const datePattern = /^\d{4}-\d{2}$/;
    if (!datePattern.test(expirationDate)) {
      console.log('ScannerScreen: Invalid date format');
      setModalConfig({
        title: 'Invalid Date Format',
        message: 'Please enter the date in YYYY-MM format (e.g., 2024-12 for December 2024).',
        type: 'warning',
      });
      setModalVisible(true);
      return;
    }

    // Check if store is linked
    if (!currentStore?.id) {
      console.log('ScannerScreen: No store linked');
      setModalConfig({
        title: 'No Store Linked',
        message: 'Please link to a store in the Butikk tab before adding products.',
        type: 'warning',
      });
      setModalVisible(true);
      return;
    }

    // If product needs info (name or image), validate those fields
    if (needsProductInfo && !productName) {
      console.log('ScannerScreen: Product needs name');
      setModalConfig({
        title: 'Product Name Required',
        message: 'This is a new product. Please provide a product name.',
        type: 'warning',
      });
      setModalVisible(true);
      return;
    }

    console.log('ScannerScreen: Submitting expiry batch');
    setLoading(true);

    try {
      // Step 1: Upload image if provided (optional for new products)
      let uploadedImageUrl = '';
      if (imageUri) {
        try {
          console.log('ScannerScreen: Uploading image');
          const uploadResult = await uploadImage(imageUri);
          uploadedImageUrl = uploadResult.url;
          console.log('ScannerScreen: Image uploaded:', uploadedImageUrl);
        } catch (uploadError) {
          console.error('ScannerScreen: Image upload failed:', uploadError);
          // Continue without image - it's optional
          setModalConfig({
            title: 'Image Upload Failed',
            message: 'Could not upload image, but continuing with product registration.',
            type: 'warning',
          });
          setModalVisible(true);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // Step 2: Create product if needed (with name)
      if (needsProductInfo && productName) {
        try {
          console.log('ScannerScreen: Creating product with name:', productName);
          await createProduct({
            barcode,
            name: productName,
          });
          console.log('ScannerScreen: Product created');
        } catch (productError: any) {
          // If product already exists, that's fine - continue
          if (!productError.message?.includes('already exists') && !productError.message?.includes('duplicate')) {
            console.error('ScannerScreen: Product creation failed:', productError);
            throw new Error(`Failed to create product: ${productError.message}`);
          }
          console.log('ScannerScreen: Product already exists, continuing...');
        }

        // Step 3: Upload product image if we have one
        if (uploadedImageUrl && currentStore?.id) {
          try {
            const memberId = currentStore.memberId || currentStore.id;
            await uploadProductImage(barcode, uploadedImageUrl, currentStore.id, memberId);
            console.log('ScannerScreen: Product image uploaded');
          } catch (imageError) {
            console.error('ScannerScreen: Product image upload failed:', imageError);
            // Continue - image is optional
          }
        }
      }

      // Step 4: Create expiry batch (convert YYYY-MM to YYYY-MM-01 for database)
      const memberId = currentStore.memberId || currentStore.id;
      const fullDate = `${expirationDate}-01`; // Add day as 01 for database storage
      
      console.log('ScannerScreen: Creating expiry batch with data:', {
        store_id: currentStore.id,
        barcode,
        expiry_date: fullDate,
        quantity: parseInt(quantity) || 1,
        added_by_member_id: memberId,
      });

      const batch = await createExpiryBatch({
        store_id: currentStore.id,
        barcode,
        expiry_date: fullDate,
        quantity: parseInt(quantity) || 1,
        added_by_member_id: memberId,
        note: notes || undefined,
      });
      console.log('ScannerScreen: Expiry batch created successfully:', batch);
      
      // Show success message and navigate back
      setModalConfig({
        title: 'Success!',
        message: 'Product expiry batch has been saved successfully.',
        type: 'success',
      });
      setModalVisible(true);
      
      // Navigate back after modal is closed
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('ScannerScreen: Error in handleSubmit:', error);
      const errorMessage = error?.message || 'Failed to save product. Please try again.';
      setModalConfig({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    console.log('ScannerScreen: Resetting form');
    setScanned(false);
    setBarcode('');
    setProductName('');
    setExpirationDate('');
    setQuantity('1');
    setNotes('');
    setImageUri(null);
    setPrimaryImageUrl(null);
    setAllImages([]);
    setShowForm(false);
    setNeedsProductInfo(false);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <IconSymbol ios_icon_name="camera.fill" android_material_icon_name="camera" size={64} color={colors.textSecondary} />
          <Text style={styles.title}>Camera Permission Required</Text>
          <Text style={styles.text}>We need camera access to scan barcodes</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Scan Barcode</Text>
        <View style={{ width: 40 }} />
      </View>

      {!showForm ? (
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
              <Text style={styles.scanText}>Position barcode within the frame</Text>
            </View>
          </CameraView>

          <View style={styles.manualEntryContainer}>
            <Text style={styles.orText}>Or enter manually</Text>
            <TouchableOpacity style={styles.manualButton} onPress={handleManualBarcodeEntry}>
              <Text style={styles.manualButtonText}>Enter Barcode Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading product info...</Text>
            </View>
          )}

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Product Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Barcode *</Text>
              <TextInput
                style={styles.input}
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Enter barcode"
                placeholderTextColor={colors.textSecondary}
                editable={!loading}
              />
            </View>

            {needsProductInfo && (
              <>
                <View style={styles.infoBox}>
                  <IconSymbol ios_icon_name="info.circle" android_material_icon_name="info" size={20} color={colors.primary} />
                  <Text style={styles.infoText}>
                    This is a new product. Please provide a name. Photo is optional but recommended.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Product Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={productName}
                    onChangeText={setProductName}
                    placeholder="Enter product name"
                    placeholderTextColor={colors.textSecondary}
                    editable={!loading}
                  />
                </View>

                <View style={styles.imageButtons}>
                  <TouchableOpacity style={styles.imageButton} onPress={handleTakePhoto} disabled={loading}>
                    <IconSymbol ios_icon_name="camera.fill" android_material_icon_name="camera" size={24} color={colors.primary} />
                    <Text style={styles.imageButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={handlePickImage} disabled={loading}>
                    <IconSymbol ios_icon_name="photo.fill" android_material_icon_name="image" size={24} color={colors.primary} />
                    <Text style={styles.imageButtonText}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>

                {imageUri && (
                  <View style={styles.imagePreview}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </>
            )}

            {!needsProductInfo && productName && (
              <View style={styles.productInfo}>
                <Text style={styles.productInfoLabel}>Product:</Text>
                <Text style={styles.productInfoValue}>{productName}</Text>
              </View>
            )}

            {!needsProductInfo && primaryImageUrl && (
              <View style={styles.imagePreview}>
                <Image
                  source={{ uri: primaryImageUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                {allImages.length > 1 && (
                  <View style={styles.imageCount}>
                    <Text style={styles.imageCountText}>+{allImages.length - 1} more</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Expiration Date (Month/Year) *</Text>
                <TouchableOpacity 
                  style={styles.scanBBDButton} 
                  onPress={handleScanBBD}
                  disabled={analyzingBBD || loading}
                >
                  <IconSymbol 
                    ios_icon_name="camera.viewfinder" 
                    android_material_icon_name="camera" 
                    size={18} 
                    color={colors.primary} 
                  />
                  <Text style={styles.scanBBDButtonText}>
                    {analyzingBBD ? 'Analyzing...' : 'Scan BBD'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                value={expirationDate}
                onChangeText={setExpirationDate}
                placeholder="YYYY-MM (e.g., 2024-12)"
                placeholderTextColor={colors.textSecondary}
                editable={!loading && !analyzingBBD}
              />
              <Text style={styles.helperText}>
                Enter only month and year (e.g., 2024-12 for December 2024)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Note (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes about this batch"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || !barcode || (needsProductInfo && !productName) || !expirationDate}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Saving...' : 'Save Product'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset} disabled={loading}>
              <Text style={styles.resetButtonText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: 'transparent',
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
  manualEntryContainer: {
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  orText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  manualButton: {
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingOverlay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  scanBBDButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  scanBBDButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePreview: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.backgroundAlt,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  optionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  optionalToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  buttonContainer: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resetButton: {
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  productInfo: {
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  productInfoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  productInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  imageCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  imageCountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
