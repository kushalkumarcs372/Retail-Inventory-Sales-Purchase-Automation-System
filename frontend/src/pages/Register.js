import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userType, setUserType] = useState("customer"); // 'customer' or 'employee'
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "Cashier"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      console.log(`📝 Attempting ${userType} registration...`);
      
      let response;
      
      if (userType === "customer") {
        // Register as Customer (phone-based)
        response = await API.post("/auth/register/customer", {
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          phone: formData.phone,
          password: formData.password
        });
      } else {
        // Register as Employee (email-based)
        response = await API.post("/auth/register/employee", {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone,
          password: formData.password,
          role: formData.role
        });
      }

      console.log("✅ Registration response:", response.data);

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        login(response.data.user);
        
        alert(response.data.message || "Registration successful!");
        navigate("/");
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
      setError(
        err.response?.data?.message || 
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center" 
         style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <div className="row w-100 justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-body p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2">🛒 Metro Cash & Carry</h2>
                <p className="text-muted">Create your account</p>
              </div>

              {/* User Type Selection */}
              <div className="mb-4">
                <label className="form-label fw-bold">I am a:</label>
                <div className="btn-group w-100" role="group">
                  <input
                    type="radio"
                    className="btn-check"
                    name="userType"
                    id="customerType"
                    checked={userType === "customer"}
                    onChange={() => setUserType("customer")}
                  />
                  <label className="btn btn-outline-primary" htmlFor="customerType">
                    👤 Customer (Shopper)
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    name="userType"
                    id="employeeType"
                    checked={userType === "employee"}
                    onChange={() => setUserType("employee")}
                  />
                  <label className="btn btn-outline-primary" htmlFor="employeeType">
                    👔 Employee (Staff)
                  </label>
                </div>
                <small className="text-muted d-block mt-2">
                  {userType === "customer" 
                    ? "Register to shop and track your purchases" 
                    : "For cashiers, managers, and admin staff"}
                </small>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* First Name */}
                  <div className={userType === "customer" ? "col-md-4 mb-3" : "col-md-6 mb-3"}>
                    <label className="form-label fw-bold">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      placeholder="John"
                    />
                  </div>

                  {/* Middle Name (Customer only) */}
                  {userType === "customer" && (
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Middle Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="middle_name"
                        value={formData.middle_name}
                        onChange={handleChange}
                        placeholder="M."
                      />
                    </div>
                  )}

                  {/* Last Name */}
                  <div className={userType === "customer" ? "col-md-4 mb-3" : "col-md-6 mb-3"}>
                    <label className="form-label fw-bold">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Email (Employee only) */}
                {userType === "employee" && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="john.doe@metro.com"
                    />
                  </div>
                )}

                {/* Phone */}
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    {userType === "customer" ? "Phone Number *" : "Phone Number *"}
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="1234567890"
                    pattern="[0-9]{10}"
                  />
                  <small className="text-muted">
                    {userType === "customer" 
                      ? "Used for login and order tracking" 
                      : "Contact number"}
                  </small>
                </div>

                {/* Role (Employee only) */}
                {userType === "employee" && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Role *</label>
                    <select
                      className="form-select"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="Cashier">Cashier</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                )}

                {/* Password */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Min 6 characters"
                    minLength="6"
                  />
                </div>

                {/* Confirm Password */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Confirm Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Re-enter password"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 mb-3"
                  disabled={loading}
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none"
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>Create {userType === "customer" ? "Customer" : "Employee"} Account</>
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center">
                  <p className="text-muted mb-0">
                    Already have an account?{" "}
                    <Link to="/login" className="text-decoration-none fw-bold">
                      Login here
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;