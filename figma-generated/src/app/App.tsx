import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSpinner } from './components/LoadingSpinner';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SlotListPage } from './pages/SlotListPage';
import { SlotDetailPage } from './pages/SlotDetailPage';
import { MyReservationsPage } from './pages/MyReservationsPage';
import { ReservationHistoryPage } from './pages/ReservationHistoryPage';

// Staff Pages
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage';
import { MenuManagementPage } from './pages/staff/MenuManagementPage';
import { SlotManagementPage } from './pages/staff/SlotManagementPage';
import { SlotCreatePage } from './pages/staff/SlotCreatePage';
import { AllReservationsPage } from './pages/staff/AllReservationsPage';

const AppContent: React.FC = () => {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} onLogout={logout} />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<SlotListPage />} />
          <Route path="/slots" element={<SlotListPage />} />
          <Route path="/slots/:slotId" element={<SlotDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* User Routes */}
          <Route
            path="/reservations/my"
            element={
              <ProtectedRoute requiredRole="USER">
                <MyReservationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservations/history"
            element={
              <ProtectedRoute requiredRole="USER">
                <ReservationHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRole="STAFF">
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/menus"
            element={
              <ProtectedRoute requiredRole="STAFF">
                <MenuManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/slots"
            element={
              <ProtectedRoute requiredRole="STAFF">
                <SlotManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/slots/create"
            element={
              <ProtectedRoute requiredRole="STAFF">
                <SlotCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/reservations"
            element={
              <ProtectedRoute requiredRole="STAFF">
                <AllReservationsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
