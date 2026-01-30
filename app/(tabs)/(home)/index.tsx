import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { getProductStats, getProductEntries, type ProductEntry, type ProductStats } from "@/utils/api";

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<ProductStats>({ total: 0, fresh: 0, expiringSoon: 0, expired: 0 });
  const [recentEntries, setRecentEntries] = useState<ProductEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen: Screen focused, loading data');
      loadData();
    }, [])
  );

  const loadData = async () => {
    console.log('HomeScreen: Fetching stats and recent entries');
    setLoading(true);
    try {
      // Fetch stats from backend
      const statsData = await getProductStats();
      console.log('HomeScreen: Stats loaded:', statsData);
      setStats(statsData);

      // Fetch recent entries from backend
      const entriesData = await getProductEntries();
      console.log('HomeScreen: Entries loaded:', entriesData.length, 'items');
      setRecentEntries(entriesData);
    } catch (error) {
      console.error('HomeScreen: Error loading data:', error);
      // Keep empty state on error
      setStats({ total: 0, fresh: 0, expiringSoon: 0, expired: 0 });
      setRecentEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScanPress = () => {
    console.log('HomeScreen: User tapped Scan Barcode button');
    router.push('/scanner');
  };

  const handleViewAllPress = () => {
    console.log('HomeScreen: User tapped View All Products button');
    router.push('/products');
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

  const totalCount = stats.total;
  const freshCount = stats.fresh;
  const expiringSoonCount = stats.expiringSoon;
  const expiredCount = stats.expired;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Date Check</Text>
          <Text style={styles.subtitle}>Scan products to track expiration dates</Text>
        </View>

        <TouchableOpacity 
          style={styles.scanButton}
          onPress={handleScanPress}
          activeOpacity={0.8}
        >
          <View style={styles.scanButtonIcon}>
            <IconSymbol 
              ios_icon_name="barcode.viewfinder" 
              android_material_icon_name="qr-code-scanner" 
              size={48} 
              color="#FFFFFF" 
            />
          </View>
          <Text style={styles.scanButtonText}>Scan Barcode</Text>
          <Text style={styles.scanButtonSubtext}>Tap to start scanning</Text>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalCount}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { borderColor: colors.fresh }]}>
              <Text style={[styles.statNumber, { color: colors.fresh }]}>{freshCount}</Text>
              <Text style={styles.statLabel}>Fresh</Text>
            </View>
            <View style={[styles.statCard, { borderColor: colors.expiringSoon }]}>
              <Text style={[styles.statNumber, { color: colors.expiringSoon }]}>{expiringSoonCount}</Text>
              <Text style={styles.statLabel}>Expiring</Text>
            </View>
            <View style={[styles.statCard, { borderColor: colors.expired }]}>
              <Text style={[styles.statNumber, { color: colors.expired }]}>{expiredCount}</Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>
          </View>
        </View>

        {recentEntries.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent Checks</Text>
              <TouchableOpacity onPress={handleViewAllPress}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentEntries.slice(0, 3).map((entry, index) => {
              const statusColor = getStatusColor(entry.status);
              const statusText = getStatusText(entry.status);
              const formattedDate = formatDate(entry.expirationDate);
              
              return (
                <View key={index} style={styles.entryCard}>
                  <View style={styles.entryLeft}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>{entry.productName}</Text>
                      <Text style={styles.entryDate}>Expires: {formattedDate}</Text>
                    </View>
                  </View>
                  <Text style={[styles.statusBadge, { color: statusColor }]}>{statusText}</Text>
                </View>
              );
            })}
          </View>
        )}

        {recentEntries.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <IconSymbol 
              ios_icon_name="barcode" 
              android_material_icon_name="qr-code" 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptyText}>Start scanning barcodes to track expiration dates</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonIcon: {
    marginBottom: 12,
  },
  scanButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  scanButtonSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 16,
    margin: 6,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  recentSection: {
    marginBottom: 32,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  entryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  entryDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
});
