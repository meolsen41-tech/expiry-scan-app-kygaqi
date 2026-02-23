
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getProductByBarcode, createProductEntry, uploadImage } from '@/utils/api';
import Modal from '@/components/ui/Modal';
import { useStore } from '@/app/_layout';

export default function ScannerScreen() {
  const router = useRouter();
  const { currentStore } = useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
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
        setProductName(product.name);
        setCategory(product.category || '');
        setImageUrl(product.imageUrl || null);
      } else {
        console.log('ScannerScreen: Product not found, manual entry required');
      }
    } catch (error) {
      console.error('ScannerScreen: Error looking up product:', error);
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

  const handleSubmit = async () => {
    if (!barcode || !productName || !expirationDate) {
      console.log('ScannerScreen: Missing required fields');
      setModalConfig({
        title: 'Missing Information',
        message: 'Please fill in all required fields: Barcode, Product Name, and Expiration Date.',
        type: 'warning',
      });
      setModalVisible(true);
      return;
    }

    console.log('ScannerScreen: Submitting product entry');
    setLoading(true);

    try {
      // Upload image if selected
      let uploadedImageUrl = imageUrl;
      if (imageUri) {
        console.log('ScannerScreen: Uploading image');
        const uploadResult = await uploadImage(imageUri);
        uploadedImageUrl = uploadResult.url;
        console.log('ScannerScreen: Image uploaded:', uploadedImageUrl);
      }

      // Create product entry (include storeId and memberId if linked to a store)
      const entry = await createProductEntry({
        barcode,
        productName,
        category: category || undefined,
        expirationDate,
        quantity: parseInt(quantity) || 1,
        location: location || undefined,
        notes: notes || undefined,
        imageUrl: uploadedImageUrl || undefined,
        storeId: currentStore?.id || undefined,
        createdByMemberId: currentStore?.memberId || undefined,
      });
      console.log('[ScannerScreen] Store context:', { storeId: currentStore?.id, memberId: currentStore?.memberId });

      console.log('ScannerScreen: Product entry created:', entry);
      
      // Show success message and navigate back
      setModalConfig({
        title: 'Success!',
        message: 'Product has been saved successfully.',
        type: 'success',
      });
      setModalVisible(true);
      
      // Navigate back after modal is closed
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('ScannerScreen: Error creating product entry:', error);
      setModalConfig({
        title: 'Error',
        message: 'Failed to save product. Please try again.',
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
    setCategory('');
    setExpirationDate('');
    setQuantity('1');
    setLocation('');
    setNotes('');
    setImageUri(null);
    setImageUrl(null);
    setShowForm(false);
    setShowOptionalFields(false);
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expiration Date *</Text>
              <TextInput
                style={styles.input}
                value={expirationDate}
                onChangeText={setExpirationDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                editable={!loading}
              />
            </View>

            {(imageUri || imageUrl) && (
              <View style={styles.imagePreview}>
                <Image
                  source={{ uri: imageUri || imageUrl || undefined }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              </View>
            )}

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

            <TouchableOpacity
              style={styles.optionalToggle}
              onPress={() => setShowOptionalFields(!showOptionalFields)}
            >
              <Text style={styles.optionalToggleText}>
                {showOptionalFields ? 'Hide' : 'Show'} Optional Fields
              </Text>
              <IconSymbol
                ios_icon_name={showOptionalFields ? 'chevron.up' : 'chevron.down'}
                android_material_icon_name={showOptionalFields ? 'expand-less' : 'expand-more'}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

            {showOptionalFields && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <TextInput
                    style={styles.input}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="e.g., Dairy, Meat, Produce"
                    placeholderTextColor={colors.textSecondary}
                    editable={!loading}
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
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g., Shelf A3, Cooler 2"
                    placeholderTextColor={colors.textSecondary}
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Additional notes"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                    editable={!loading}
                  />
                </View>
              </>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || !barcode || !productName || !expirationDate}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
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
});
