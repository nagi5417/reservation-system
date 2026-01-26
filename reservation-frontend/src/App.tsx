import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { HomePage } from "./pages/HomePage";
import { MyReservationsPage } from "./pages/MyReservationsPage";
import { ReservationHistoryPage } from "./pages/ReservationHistoryPage";
import { SlotDetailPage } from "./pages/SlotDetailPage";
import { StaffDashboardPage } from "./pages/StaffDashboardPage";
import { StaffMenusPage } from "./pages/StaffMenusPage";
import { StaffSlotsPage } from "./pages/StaffSlotsPage";
import { StaffReservationsPage } from "./pages/StaffReservationsPage";

// Headerにユーザー情報を渡すためのラッパーコンポーネント
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div style={styles.app}>
      <Header user={user} onLogout={logout} />
      <main style={styles.main}>{children}</main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* 公開ルート */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/slots/:id" element={<SlotDetailPage />} />

            {/* ユーザー保護ルート */}
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

            {/* スタッフ保護ルート */}
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
                  <StaffMenusPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/slots"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <StaffSlotsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/reservations"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <StaffReservationsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
  },
  main: {
    flex: 1,
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    padding: "24px 16px",
  },
  page: {
    padding: "40px 20px",
    textAlign: "center" as const,
  },
};
