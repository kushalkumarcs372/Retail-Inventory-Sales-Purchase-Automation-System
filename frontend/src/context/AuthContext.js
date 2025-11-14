import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // shape normalized below
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // normalize user to a single shape
  const normalize = (u) => {
    if (!u) return null;
    const type = u.type || (u.role && u.role !== "Customer" ? "employee" : "customer");
    const role = u.role || (type === "employee" ? "Cashier" : "Customer");

    // Only customers have customer_id
    const customer_id = role === "Customer" ? (u.customer_id || u.id) : undefined;

    return {
      id: u.id ?? customer_id, // id always present
      customer_id, // undefined for staff
      type, // 'customer' | 'employee'
      role, // 'Customer' | 'Admin' | 'Manager' | 'Cashier'
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      email: u.email || null,
      phone: u.phone || null,
      access_level: u.access_level || (role === "Customer" ? "customer" : role.toLowerCase()),
    };
  };

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const norm = normalize(parsed);
        setUser(norm);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (serverUser) => {
    const norm = normalize(serverUser);
    setUser(norm);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(norm));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        isStaff: ["admin", "manager", "cashier"].includes(user?.role?.toLowerCase?.() || ""),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
