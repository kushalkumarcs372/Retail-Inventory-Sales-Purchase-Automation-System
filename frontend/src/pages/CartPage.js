import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function CartPage() {
  const { cart, loading, updateCartItem, removeFromCart, clearCart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState({});

  const loadCart = useCallback(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (cart && cart.items) {
      setCartItems(cart.items);
      setTotal(parseFloat(cart.total || 0));
    }
  }, [cart]);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(prev => ({ ...prev, [productId]: true }));
    
    try {
      await updateCartItem(cart.cart_id, productId, newQuantity);
      await fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Failed to update quantity");
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemoveItem = async (productId) => {
    if (window.confirm("Remove this item from cart?")) {
      setUpdating(prev => ({ ...prev, [productId]: true }));
      
      try {
        await removeFromCart(cart.cart_id, productId);
        await fetchCart();
      } catch (error) {
        console.error("Error removing item:", error);
        alert("Failed to remove item");
      } finally {
        setUpdating(prev => ({ ...prev, [productId]: false }));
      }
    }
  };

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear the entire cart?")) {
      try {
        await clearCart(cart.cart_id);
        await fetchCart();
      } catch (error) {
        console.error("Error clearing cart:", error);
        alert("Failed to clear cart");
      }
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                    <i className="bi bi-cart3" style={{ fontSize: "1.8rem", marginRight: "10px" }}></i>
                    Shopping Cart
                  </h2>
                  <p className="text-muted mb-0">
                    {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
                  </p>
                </div>
                {cartItems.length > 0 && (
                  <button
                    className="btn btn-outline-danger"
                    onClick={handleClearCart}
                    style={{ borderRadius: "25px" }}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Clear Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Content */}
      {cartItems.length === 0 ? (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body text-center py-5">
                <div style={{ fontSize: "6rem", opacity: 0.2 }}>
                  <i className="bi bi-cart-x"></i>
                </div>
                <h4 className="text-muted mb-3 mt-3">Your cart is empty</h4>
                <p className="text-muted mb-4">Add some products to get started!</p>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate("/products")}
                  style={{ borderRadius: "25px", padding: "12px 40px" }}
                >
                  <i className="bi bi-bag-plus me-2"></i>
                  Browse Products
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {/* Cart Items */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-body p-0">
                {cartItems.map((item, index) => (
                  <div
                    key={item.product_id}
                    className="p-4"
                    style={{
                      borderBottom: index < cartItems.length - 1 ? "1px solid #e9ecef" : "none",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                  >
                    <div className="row align-items-center">
                      {/* Product Info */}
                      <div className="col-md-5">
                        <div className="d-flex align-items-center">
                          <div 
                            style={{
                              width: "60px",
                              height: "60px",
                              backgroundColor: "#e9ecef",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: "15px"
                            }}
                          >
                            <i className="bi bi-box-seam" style={{ fontSize: "1.5rem", color: "#6c757d" }}></i>
                          </div>
                          <div>
                            <h6 className="mb-1 fw-bold">{item.product_name}</h6>
                            <p className="text-muted mb-0 small">{item.brand}</p>
                            <small className="text-muted">
                              <i className="bi bi-box me-1"></i>
                              Stock: {item.stock} units
                            </small>
                          </div>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="col-md-2 text-center">
                        <p className="text-muted mb-1 small">Unit Price</p>
                        <h6 className="mb-0 fw-bold">₹{parseFloat(item.unit_price).toFixed(2)}</h6>
                      </div>

                      {/* Quantity Controls */}
                      <div className="col-md-2 text-center">
                        <p className="text-muted mb-2 small">Quantity</p>
                        <div className="input-group input-group-sm justify-content-center">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updating[item.product_id]}
                            style={{ borderRadius: "20px 0 0 20px" }}
                          >
                            <i className="bi bi-dash"></i>
                          </button>
                          <input
                            type="number"
                            className="form-control text-center"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              if (val > 0 && val <= item.stock) {
                                handleQuantityChange(item.product_id, val);
                              }
                            }}
                            min="1"
                            max={item.stock}
                            disabled={updating[item.product_id]}
                            style={{ maxWidth: "60px" }}
                          />
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock || updating[item.product_id]}
                            style={{ borderRadius: "0 20px 20px 0" }}
                          >
                            <i className="bi bi-plus"></i>
                          </button>
                        </div>
                        {updating[item.product_id] && (
                          <small className="text-primary mt-1 d-block">
                            <i className="bi bi-arrow-repeat"></i> Updating...
                          </small>
                        )}
                      </div>

                      {/* Total Price & Remove */}
                      <div className="col-md-3 text-end">
                        <p className="text-muted mb-1 small">Total</p>
                        <h5 className="mb-2 text-primary fw-bold">
                          ₹{parseFloat(item.total_price).toFixed(2)}
                        </h5>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveItem(item.product_id)}
                          disabled={updating[item.product_id]}
                          style={{ borderRadius: "20px" }}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="btn btn-outline-primary mt-3"
              onClick={() => navigate("/products")}
              style={{ borderRadius: "25px" }}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Continue Shopping
            </button>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: "20px", borderRadius: "15px" }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Order Summary</h5>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Subtotal ({cartItems.length} items)</span>
                  <span className="fw-semibold">₹{total.toFixed(2)}</span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Tax (GST 0%)</span>
                  <span className="fw-semibold">₹0.00</span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Discount</span>
                  <span className="text-success fw-semibold">-₹0.00</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between mb-4">
                  <h5 className="fw-bold mb-0">Total Amount</h5>
                  <h4 className="fw-bold mb-0 text-primary">₹{total.toFixed(2)}</h4>
                </div>

                <button
                  className="btn btn-primary w-100 btn-lg fw-semibold mb-3"
                  onClick={handleCheckout}
                  style={{ borderRadius: "25px" }}
                >
                  <i className="bi bi-credit-card me-2"></i>
                  Proceed to Checkout
                </button>

                <div className="p-3 bg-light rounded" style={{ borderRadius: "10px" }}>
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-shield-check text-success me-2"></i>
                    <small className="text-muted">Secure checkout</small>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-truck text-primary me-2"></i>
                    <small className="text-muted">Fast delivery</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-arrow-repeat text-info me-2"></i>
                    <small className="text-muted">Easy returns</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;