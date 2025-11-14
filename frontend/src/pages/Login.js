import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: "",
    password: ""
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
    setLoading(true);

    try {
      console.log("🔑 Attempting login...");
      
      const response = await API.post("/auth/login", {
        identifier: formData.identifier,
        password: formData.password
      });

      console.log("✅ Login response:", response.data);

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        login(response.data.user);
        
        alert(response.data.message || "Login successful!");
        navigate("/");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(
        err.response?.data?.message || 
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center" 
         style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <div className="row w-100 justify-content-center">
        <div className="col-md-5 col-lg-4">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-body p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2">🛒 Metro Cash & Carry</h2>
                <p className="text-muted">Welcome back! Please login</p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                {/* Phone/Email */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Phone / Email</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                    placeholder="Phone number or email"
                  />
                  <small className="text-muted">
                    Customers: use phone | Employees: use email
                  </small>
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Password</label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
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
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>

                {/* Register Link */}
                <div className="text-center">
                  <p className="text-muted mb-0">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-decoration-none fw-bold">
                      Register here
                    </Link>
                  </p>
                </div>
              </form>

              {/* Info Box */}
              <div className="mt-4 p-3 bg-light rounded">
                <small className="text-muted">
                  <strong>📱 Customers:</strong> Login with phone number<br />
                  <strong>👔 Employees:</strong> Login with email address
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;