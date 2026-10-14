import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Quotation } from '../types';

interface QuotationsScreenProps {
  quotations: Quotation[];
  loading: boolean;
  onRefresh: () => void;
}

export const QuotationsScreen: React.FC<QuotationsScreenProps> = ({
  quotations,
  loading,
  onRefresh,
}) => {
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Approved':
        return '#059669';
      case 'Sent':
        return '#2563EB';
      case 'Draft':
        return '#D97706';
      case 'Expired':
        return '#DC2626';
      default:
        return '#475569';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBanner}>
        <View>
          <Text style={styles.bannerTitle}>Commercial Quotations</Text>
          <Text style={styles.bannerSubtitle}>{quotations.length} Active Formal Quotations</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Fetching quotation documents...</Text>
        </View>
      ) : quotations.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>📑</Text>
          <Text style={styles.emptyTitle}>No Quotations Found</Text>
          <Text style={styles.emptySub}>
            Formal quotations generated from opportunities will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={quotations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={loading}
          renderItem={({ item }) => {
            const color = getStatusColor(item.status);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => setSelectedQuotation(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quoteNo}>{item.quotationNo}</Text>
                    <Text style={styles.custName}>
                      🏢 {item.customer?.name || item.customerName || 'Customer'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${color}15` }]}>
                    <Text style={[styles.statusBadgeText, { color }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <Text style={styles.dateText}>
                    Date: {item.quotationDate ? new Date(item.quotationDate).toLocaleDateString('en-IN') : '-'}
                  </Text>
                  {item.validUntil && (
                    <Text style={styles.validText}>
                      Valid: {new Date(item.validUntil).toLocaleDateString('en-IN')}
                    </Text>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.itemsCount}>
                    {item.items?.length || 1} Machinery Line Item(s)
                  </Text>
                  <Text style={styles.grandTotal}>
                    ₹{Math.round(item.grandTotal || item.subTotal || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Quotation Detail Modal */}
      <Modal visible={!!selectedQuotation} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedQuotation?.quotationNo}</Text>
              <Text style={styles.modalCust}>
                {selectedQuotation?.customer?.name || selectedQuotation?.customerName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedQuotation(null)}
              style={styles.closeBtn}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748B' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <Text style={styles.sectionHeading}>Machinery Line Items</Text>
            {(selectedQuotation?.items || []).map((line, idx) => (
              <View key={idx} style={styles.lineItemCard}>
                <View style={styles.lineHeader}>
                  <Text style={styles.productName}>
                    {line.productName || line.modelNumber || `Item #${idx + 1}`}
                  </Text>
                  <Text style={styles.lineTotal}>
                    ₹{Math.round(line.totalPrice).toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={styles.lineSub}>
                  Quantity: {line.quantity} Unit(s) • Unit Rate: ₹{line.unitPrice.toLocaleString('en-IN')} (Locked from Master)
                </Text>
              </View>
            ))}

            {/* Financial Summary */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sub Total (Excl. Tax):</Text>
                <Text style={styles.summaryVal}>
                  ₹{Math.round(selectedQuotation?.subTotal || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST / Tax (18%):</Text>
                <Text style={styles.summaryVal}>
                  ₹{Math.round(selectedQuotation?.taxAmount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total (Incl. Taxes):</Text>
                <Text style={styles.grandTotalVal}>
                  ₹{Math.round(selectedQuotation?.grandTotal || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <Text style={styles.termsHeading}>Terms & Conditions</Text>
            <Text style={styles.termsText}>
              • 100% genuine industrial machinery equipment backed by standard manufacturer warranty.{'\n'}
              • Standard payment terms: 50% advance along with confirmed PO, balance before delivery.{'\n'}
              • On-site installation and field demonstration handled by certified service engineers.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBanner: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    fontSize: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  quoteNo: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  custName: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
  },
  validText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  itemsCount: {
    fontSize: 11,
    color: '#64748B',
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCust: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  lineItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  lineSub: {
    fontSize: 11,
    color: '#64748B',
  },
  summaryBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#475569',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#C7D2FE',
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#312E81',
  },
  grandTotalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#4F46E5',
  },
  termsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  termsText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 18,
  },
});
