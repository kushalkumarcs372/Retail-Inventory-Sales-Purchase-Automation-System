import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import API from "../api";

function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (cart && cart.items) {
      setCartItems(cart.items);
      setTotal(parseFloat(cart.total || 0));
    }
  }, [cart]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (!paymentMode) {
      alert("Please select a payment mode!");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/cart/checkout", {
        cart_id: cart.cart_id,
        employee_id: user?.employee_id || 1,
        payment_mode: paymentMode
      });

      if (response.data.success) {
        alert("✅ Order placed successfully!");
        navigate("/bills");
      } else {
        alert("Checkout failed: " + response.data.message);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to complete checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <div style={{ fontSize: "5rem", opacity: 0.3 }}>🛒</div>
        <h4 className="text-muted mb-3">Your cart is empty</h4>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/products")}
        >
          Go to Products
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h2 className="mb-0 fw-bold">
                <span style={{ fontSize: "1.5rem" }}>💳</span> Checkout
              </h2>
              <p className="text-muted mb-0">Complete your purchase</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Order Review */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">📦 Order Review</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="py-3">Quantity</th>
                      <th className="py-3">Unit Price</th>
                      <th className="py-3 text-end pe-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.product_id}>
                        <td className="px-4 py-3">
                          <div>
                            <div className="fw-bold">{item.product_name}</div>
                            <small className="text-muted">{item.brand}</small>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="badge bg-primary">{item.quantity}</span>
                        </td>
                        <td className="py-3">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td className="py-3 text-end pe-4 fw-bold">
                          ₹{parseFloat(item.total_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">💰 Payment Method</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <div
                    className={`card h-100 cursor-pointer ${
                      paymentMode === "Cash" ? "border-primary" : ""
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setPaymentMode("Cash")}
                  >
                    <div className="card-body text-center">
                      <div style={{ fontSize: "3rem" }}>💵</div>
                      <h6 className="mt-2 mb-0">Cash</h6>
                      <small className="text-muted">Pay with cash</small>
                      {paymentMode === "Cash" && (
                        <div className="mt-2">
                          <i className="bi bi-check-circle-fill text-primary"></i>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div
                    className={`card h-100 cursor-pointer ${
                      paymentMode === "Card" ? "border-primary" : ""
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setPaymentMode("Card")}
                  >
                    <div className="card-body text-center">
                      <div style={{ fontSize: "3rem" }}>💳</div>
                      <h6 className="mt-2 mb-0">Card</h6>
                      <small className="text-muted">Debit/Credit Card</small>
                      {paymentMode === "Card" && (
                        <div className="mt-2">
                          <i className="bi bi-check-circle-fill text-primary"></i>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div
                    className={`card h-100 cursor-pointer ${
                      paymentMode === "UPI" ? "border-primary" : ""
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setPaymentMode("UPI")}
                  >
                    <div className="card-body text-center">
                      <div style={{ fontSize: "3rem" }}>📱</div>
                      <h6 className="mt-2 mb-0">UPI</h6>
                      <small className="text-muted">Google Pay, PhonePe</small>
                      {paymentMode === "UPI" && (
                        <div className="mt-2">
                          <i className="bi bi-check-circle-fill text-primary"></i>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: "20px" }}>
            <div className="card-body">
              <h5 className="fw-bold mb-4">Order Summary</h5>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal ({cartItems.length} items)</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Tax (0%)</span>
                <span>₹0.00</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Delivery</span>
                <span className="text-success">FREE</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-4">
                <h5 className="fw-bold mb-0">Total Amount</h5>
                <h5 className="fw-bold mb-0 text-primary">₹{total.toFixed(2)}</h5>
              </div>

              <button
                className="btn btn-success w-100 btn-lg fw-semibold mb-3"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Place Order
                  </>
                )}
              </button>

              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => navigate("/cart")}
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Cart
              </button>

              <div className="mt-3 p-3 bg-light rounded">
                <small className="text-muted d-block mb-2">
                  <i className="bi bi-shield-check me-1"></i>
                  <strong>Secure Checkout</strong>
                </small>
                <small className="text-muted d-block">
                  Your payment information is processed securely.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;