import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { getCartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const cartItemCount = getCartCount();

  // PascalCase role checks
  const role = user?.role || "Customer";
  const isCustomer = role === "Customer";
  const isStaff = role === "Admin" || role === "Manager" || role === "Cashier";

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (["/login", "/register"].includes(location.pathname)) return null;

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark shadow-sm sticky-top"
      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
    >
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <span style={{ fontSize: "1.5rem" }}>🏪</span>
          <span className="ms-2 d-none d-md-inline">Metro Cash & Carry</span>
          <span className="ms-2 d-inline d-md-none">Metro</span>
        </Link>

        <button className="navbar-toggler border-0" type="button" onClick={() => setIsOpen(!isOpen)}>
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
            <li className="nav-item">
              <Link className={`nav-link px-3 rounded ${isActive("/") ? "active fw-bold bg-white bg-opacity-25" : ""}`} to="/">
                <span style={{ fontSize: "1.2rem" }}>🏠</span> Home
              </Link>
            </li>

            <li className="nav-item">
              <Link className={`nav-link px-3 rounded ${isActive("/products") ? "active fw-bold bg-white bg-opacity-25" : ""}`} to="/products">
                <span style={{ fontSize: "1.2rem" }}>📦</span> Products
              </Link>
            </li>

            {/* Staff-only Dashboard link (if you later add a /dashboard page) */}
            {isStaff && (
              <li className="nav-item">
                <Link className={`nav-link px-3 rounded ${isActive("/dashboard") ? "active fw-bold bg-white bg-opacity-25" : ""}`} to="/dashboard">
                  <span style={{ fontSize: "1.2rem" }}>📊</span> Dashboard
                </Link>
              </li>
            )}

            {/* Bills: staff → All Bills, customer → My Bills */}
            <li className="nav-item">
              <Link className={`nav-link px-3 rounded ${isActive("/bills") ? "active fw-bold bg-white bg-opacity-25" : ""}`} to="/bills">
                <span style={{ fontSize: "1.2rem" }}>📄</span> {isCustomer ? "My Bills" : "Bills"}
              </Link>
            </li>

            <li className="nav-item">
              <Link className={`nav-link px-3 rounded ${isActive("/membership") ? "active fw-bold bg-white bg-opacity-25" : ""}`} to="/membership">
                <span style={{ fontSize: "1.2rem" }}>👑</span> Membership
              </Link>
            </li>

            <li className="nav-item">
              <Link className={`nav-link px-3 rounded position-relative ${isActive("/cart") ? "active fw-bold bg-white bg-opacity-25" : ""}`} to="/cart">
                <span style={{ fontSize: "1.2rem" }}>🛒</span> Cart
                {cartItemCount > 0 && (
                  <span className="position-absolute translate-middle badge rounded-pill bg-danger" style={{ top: "5px", left: "65px", fontSize: "0.7rem" }}>
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </li>

            {isAuthenticated && user && (
              <li className="nav-item dropdown ms-lg-3">
                <button
                  className="btn btn-link nav-link dropdown-toggle d-flex align-items-center gap-2 text-white text-decoration-none"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{ border: "none" }}
                >
                  <div className="rounded-circle bg-white d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                    <span style={{ fontSize: "1.2rem" }}>👤</span>
                  </div>
                  <span className="d-none d-lg-inline">{user.first_name}</span>
                </button>

                {showUserMenu && (
                  <div className="dropdown-menu dropdown-menu-end show">
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <span style={{ fontSize: "1rem" }}>🚪</span> Logout
                    </button>
                  </div>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
