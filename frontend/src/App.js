import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Products from "./pages/Products";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import BillsPage from "./pages/BillsPage";
import MembershipPage from "./pages/MembershipPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="container mt-5 text-center">
    <div className="spinner-border text-primary" role="status"></div>
  </div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// STAFF ONLY ROUTE (Admin / Manager / Cashier)
function StaffOnly({ children }) {
  const { user, isStaff, loading } = useAuth();

  if (loading) return null;

  if (!isStaff) {
    return <Navigate to="/" />;
  }
  return children;
}

function AppContent() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

        {/* bills page: staff sees all bills | customer sees only theirs (will implement inside BillsPage next) */}
        <Route path="/bills" element={<ProtectedRoute><BillsPage /></ProtectedRoute>} />
        <Route path="/bills/:billId" element={<ProtectedRoute><BillsPage /></ProtectedRoute>} />

        {/* membership is normal for customer also */}
        <Route path="/membership" element={<ProtectedRoute><MembershipPage /></ProtectedRoute>} />

        {/* dashboard route (you will add page later) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
