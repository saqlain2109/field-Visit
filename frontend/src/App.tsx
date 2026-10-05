import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme } from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './components/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MastersPage } from './pages/MastersPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { CustomersPage } from './pages/CustomersPage';
import { ContactsPage } from './pages/ContactsPage';
import { DailyVisitsPage } from './pages/DailyVisitsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { MonthlyReportPage } from './pages/MonthlyReportPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ProfilePage } from './pages/ProfilePage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { LoginLogsPage } from './pages/LoginLogsPage';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Main Authenticated Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="daily-visits" element={<DailyVisitsPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="reports/monthly" element={<MonthlyReportPage />} />
        <Route path="masters" element={<MastersPage />} />
        <Route path="crm/opportunities" element={<OpportunitiesPage />} />
        <Route path="crm/quotations" element={<QuotationsPage />} />
        <Route path="user-management" element={<UserManagementPage />} />
        <Route path="login-logs" element={<LoginLogsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
