import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { apiFetch } from './src/config/api';
import {
  DailyVisit,
  Customer,
  Opportunity,
  Quotation,
  ActivityType,
  ProductMaster,
  ExpenseHead,
  GradeFuelRate,
} from './src/types';

import { Header } from './src/components/Header';
import { BottomTabBar } from './src/components/BottomTabBar';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DailyVisitsScreen } from './src/screens/DailyVisitsScreen';
import { ApprovalsScreen } from './src/screens/ApprovalsScreen';
import { OpportunitiesScreen } from './src/screens/OpportunitiesScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';
import { QuotationsScreen } from './src/screens/QuotationsScreen';
import { UserManagementScreen } from './src/screens/UserManagementScreen';
import { MastersScreen } from './src/screens/MastersScreen';
import { AuditLogsScreen } from './src/screens/AuditLogsScreen';
import { MoreHubScreen } from './src/screens/MoreHubScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LogVisitModal } from './src/screens/LogVisitModal';

const MainNavigator: React.FC = () => {
  const { user, token, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dataLoading, setDataLoading] = useState(false);
  const [openLogModal, setOpenLogModal] = useState(false);

  // App Data States
  const [visits, setVisits] = useState<DailyVisit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
  const [gradeFuelRates, setGradeFuelRates] = useState<GradeFuelRate[]>([]);

  // Fetch all live data when user logs in
  useEffect(() => {
    if (token && user) {
      fetchMasterAndDomainData();
    }
  }, [token, user]);

  const fetchMasterAndDomainData = async () => {
    setDataLoading(true);
    try {
      const [vData, cData, opData, qData, mData] = await Promise.all([
        apiFetch<DailyVisit[]>('/daily-visits').catch(() => []),
        apiFetch<Customer[]>('/customers').catch(() => []),
        apiFetch<Opportunity[]>('/opportunities').catch(() => []),
        apiFetch<Quotation[]>('/quotations').catch(() => []),
        apiFetch<any>('/masters/summary').catch(() => ({})),
      ]);

      setVisits(vData || []);
      const activeCustomers = (cData || []).filter((c) => c.status === 'Active');
      setCustomers(activeCustomers.length > 0 ? activeCustomers : cData || []);
      setOpportunities(opData || []);
      setQuotations(qData || []);

      if (mData) {
        setActivityTypes(mData.activityTypes || []);
        setProducts(mData.products || []);
        setExpenseHeads(mData.expenseHeads || []);
        setGradeFuelRates(mData.gradeFuelRates || []);
      }
    } catch (err: any) {
      console.warn('Failed to load initial CRM dataset:', err);
    } finally {
      setDataLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // If user is not authenticated, show Login Screen
  if (!token || !user) {
    return <LoginScreen />;
  }

  const pendingApprovalsCount = visits.filter((v) => v.status === 'Submitted').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <Header onRefresh={fetchMasterAndDomainData} refreshing={dataLoading} />

      {/* Active Tab Screen */}
      <View style={styles.mainContainer}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            visits={visits}
            opportunities={opportunities}
            customers={customers}
            loading={dataLoading}
            onOpenLogVisit={() => setOpenLogModal(true)}
            onNavigateTab={setActiveTab}
            onRefresh={fetchMasterAndDomainData}
          />
        )}

        {activeTab === 'visits' && (
          <DailyVisitsScreen
            visits={visits}
            loading={dataLoading}
            onOpenLogVisit={() => setOpenLogModal(true)}
            onRefresh={fetchMasterAndDomainData}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalsScreen
            visits={visits}
            loading={dataLoading}
            onRefresh={fetchMasterAndDomainData}
          />
        )}

        {activeTab === 'opportunities' && (
          <OpportunitiesScreen
            opportunities={opportunities}
            customers={customers}
            loading={dataLoading}
            onRefresh={fetchMasterAndDomainData}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersScreen
            customers={customers}
            loading={dataLoading}
            onRefresh={fetchMasterAndDomainData}
          />
        )}

        {activeTab === 'quotations' && (
          <QuotationsScreen
            quotations={quotations}
            loading={dataLoading}
            onRefresh={fetchMasterAndDomainData}
          />
        )}

        {activeTab === 'users' && (
          <UserManagementScreen
            onRefresh={fetchMasterAndDomainData}
            onBack={() => setActiveTab('hub')}
          />
        )}

        {activeTab === 'masters' && (
          <MastersScreen onBack={() => setActiveTab('hub')} />
        )}

        {activeTab === 'audit_logs' && (
          <AuditLogsScreen onBack={() => setActiveTab('hub')} />
        )}

        {activeTab === 'hub' && (
          <MoreHubScreen
            onNavigateTab={setActiveTab}
            pendingApprovalsCount={pendingApprovalsCount}
          />
        )}

        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      {/* Log Visit Modal */}
      <LogVisitModal
        visible={openLogModal}
        onClose={() => setOpenLogModal(false)}
        onSuccess={fetchMasterAndDomainData}
        customers={customers}
        activityTypes={activityTypes}
        products={products}
        gradeFuelRates={gradeFuelRates}
      />

      {/* Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
});
