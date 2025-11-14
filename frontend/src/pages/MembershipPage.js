import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api";

function MembershipPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMode, setPaymentMode] = useState("Card");
  const [notification, setNotification] = useState(null);

  const isCustomer = user?.role === "Customer" && user?.customer_id;

  useEffect(() => {
    if (isCustomer) fetchMembershipData();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomer, user?.customer_id]);

  const fetchMembershipData = async () => {
    try {
      setLoading(true);
      const [plansRes, membershipRes] = await Promise.all([
        API.get("/membership/plans/all"),
        API.get(`/membership/${user.customer_id}`),
      ]);
      setPlans(plansRes.data || []);
      if (membershipRes.data?.hasMembership) setCurrentMembership(membershipRes.data.membership);
    } catch (err) {
      showNotification("error", "Failed to load membership data");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !paymentMode) {
      showNotification("error", "Please select a plan and payment mode");
      return;
    }
    setPurchasing(true);
    try {
      const res = await API.post("/membership/purchase", {
        customer_id: user.customer_id,
        type: selectedPlan.type,
        payment_mode: paymentMode,
      });
      showNotification("success", res.data?.message || "Membership purchased");
      setSelectedPlan(null);
      await fetchMembershipData();
    } catch (err) {
      showNotification("error", err.response?.data?.error || "Failed to purchase membership");
    } finally {
      setPurchasing(false);
    }
  };

  const getBadge = (type) => {
    const m = {
      Silver: { color: "#C0C0C0", icon: "🥈" },
      Gold: { color: "#FFD700", icon: "🥇" },
      Platinum: { color: "#E5E4E2", icon: "💎" },
    };
    return m[type] || m.Silver;
  };

  if (!isCustomer) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info shadow-sm">
          Membership is only available for customers. Please login as a customer to view/purchase plans.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading membership plans...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* toast */}
      {notification && (
        <div
          className={`position-fixed top-0 end-0 m-3 alert alert-${
            notification.type === "success" ? "success" : "danger"
          } alert-dismissible fade show shadow-lg`}
          style={{ zIndex: 9999, minWidth: "300px", borderRadius: "15px" }}
          role="alert"
        >
          <strong>{notification.type === "success" ? "✅ " : "❌ "}{notification.message}</strong>
          <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
        </div>
      )}

      {/* header */}
      <div className="row mb-4">
        <div className="col-12">
          <div
            className="card border-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", borderRadius: "15px" }}
          >
            <div className="card-body p-4">
              <h2 className="mb-2 fw-bold">
                <span style={{ fontSize: "1.5rem" }}>👑</span> Membership Plans
              </h2>
              <p className="mb-0 opacity-75">Unlock exclusive benefits and savings</p>
            </div>
          </div>
        </div>
      </div>

      {/* current membership */}
      {currentMembership && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h5 className="mb-2 fw-bold">
                      {getBadge(currentMembership.type).icon} Current Membership:{" "}
                      <span style={{ color: getBadge(currentMembership.type).color, fontWeight: "bold" }}>
                        {currentMembership.type}
                      </span>
                    </h5>
                    <p className="mb-1">
                      <strong>Status:</strong>{" "}
                      <span
                        className={`badge ${
                          currentMembership.status === "Active"
                            ? "bg-success"
                            : currentMembership.status === "Expiring Soon"
                            ? "bg-warning text-dark"
                            : "bg-danger"
                        }`}
                      >
                        {currentMembership.status}
                      </span>
                    </p>
                    <p className="mb-0">
                      <strong>Valid Until:</strong>{" "}
                      {new Date(currentMembership.end_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {currentMembership.days_remaining > 0 && ` (${currentMembership.days_remaining} days remaining)`}
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end mt-3 mt-md-0" style={{ fontSize: "4rem" }}>
                    {getBadge(currentMembership.type).icon}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* plans */}
      <div className="row g-4">
        {plans.map((plan) => {
          const badge = getBadge(plan.type);
          const isCurrent = currentMembership?.type === plan.type;
          const isSelected = selectedPlan?.type === plan.type;

          return (
            <div className="col-md-6 col-lg-4" key={plan.type}>
              <div
                className="card h-100 border-0 shadow-sm"
                style={{
                  borderRadius: "15px",
                  border: isSelected ? "3px solid #667eea" : "none",
                  transform: isSelected ? "scale(1.03)" : "scale(1)",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  className="card-header text-center py-4"
                  style={{
                    background: `linear-gradient(135deg, ${badge.color}30, ${badge.color}50)`,
                    border: "none",
                    borderRadius: "15px 15px 0 0",
                  }}
                >
                  <div style={{ fontSize: "4rem" }} className="mb-2">
                    {badge.icon}
                  </div>
                  <h3 className="fw-bold mb-0" style={{ color: badge.color }}>
                    {plan.type}
                  </h3>
                  {isCurrent && <span className="badge bg-success mt-2">Current Plan</span>}
                </div>

                <div className="card-body text-center p-4">
                  <div className="mb-4">
                    <h2 className="fw-bold mb-0">
                      ₹{plan.price}
                      <small className="text-muted fs-6">/year</small>
                    </h2>
                  </div>

                  <div className="text-start mb-4">
                    <h6 className="fw-bold mb-3">Features:</h6>
                    {plan.features.map((f, i) => (
                      <div key={i} className="mb-2">
                        <span style={{ color: badge.color, fontWeight: "bold" }}>✓</span> {f}
                      </div>
                    ))}
                  </div>

                  <button
                    className={`btn w-100 ${isSelected ? "btn-primary" : "btn-outline-primary"}`}
                    style={{ borderRadius: "25px" }}
                    onClick={() => setSelectedPlan(plan)}
                    disabled={isCurrent}
                  >
                    {isCurrent ? "Current Plan" : isSelected ? "Selected ✓" : "Select Plan"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* purchase modal */}
      {selectedPlan && (
        <>
          <div
            className="modal-backdrop show"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", position: "fixed", inset: 0, zIndex: 1040 }}
            onClick={() => !purchasing && setSelectedPlan(null)}
          />
          <div
            className="modal show d-block"
            style={{ position: "fixed", inset: 0, zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !purchasing) setSelectedPlan(null);
            }}
          >
            <div className="card border-0 shadow-lg" style={{ maxWidth: 500, width: "90%", borderRadius: 15 }} onClick={(e) => e.stopPropagation()}>
              <div
                className="card-header text-white"
                style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "15px 15px 0 0" }}
              >
                <h5 className="mb-0 fw-bold">
                  {getBadge(selectedPlan.type).icon} Purchase {selectedPlan.type} Membership
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-4 text-center">
                  <h3 className="mb-2 fw-bold">Total: ₹{selectedPlan.price}</h3>
                  <p className="text-muted mb-0">Valid for {selectedPlan.duration} days (1 year)</p>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">Payment Method</label>
                  <div className="row g-2">
                    {["Card", "UPI", "Cash"].map((mode) => (
                      <div className="col-4" key={mode}>
                        <button
                          type="button"
                          className={`btn w-100 ${paymentMode === mode ? "btn-primary" : "btn-outline-secondary"}`}
                          style={{ borderRadius: 10, padding: "15px 10px" }}
                          onClick={() => setPaymentMode(mode)}
                          disabled={purchasing}
                        >
                          <div style={{ fontSize: "1.5rem" }}>{mode === "Card" ? "💳" : mode === "UPI" ? "📱" : "💵"}</div>
                          <small>{mode}</small>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    style={{ borderRadius: 25 }}
                    onClick={handlePurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing Payment...
                      </>
                    ) : (
                      <>Pay ₹{selectedPlan.price}</>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    style={{ borderRadius: 25 }}
                    onClick={() => setSelectedPlan(null)}
                    disabled={purchasing}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MembershipPage;
