import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const FALLBACK_IMG = "https://dummyimage.com/600x400/e9ecef/6c757d&text=No+Image";

function ProductCard({ product }) {
  const { addToCart, cart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [adding, setAdding] = useState(false);
  const [imgSrc, setImgSrc] = useState(product?.image_url || FALLBACK_IMG);

  const role = user?.role || "Customer";
  const isCustomer = role === "Customer";

  const stock = Number(product.stock || 0);
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock < 10;

  const cartItem = cart?.items?.find((it) => it.product_id === product.product_id);
  const quantityInCart = Number(cartItem?.quantity || 0);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert("Please login to add items to cart.");
      return;
    }
    if (!isCustomer) {
      alert("Employees cannot use the cart. Please login as a customer.");
      return;
    }
    if (isOutOfStock) {
      alert("Product is out of stock");
      return;
    }
    if (quantityInCart >= stock) {
      alert(`Cannot add more. Only ${stock} available in stock`);
      return;
    }
    setAdding(true);
    try {
      const ok = await addToCart(product.product_id, 1);
      if (ok) alert(`✅ ${product.product_name} added to cart!`);
    } catch (e) {
      alert("Failed to add to cart. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="card h-100 shadow-sm border-0" style={{ transition: "transform 0.2s" }}>
      {/* Product Image */}
      <div className="card-img-top bg-light">
        <div className="ratio ratio-16x9">
          <img
            src={imgSrc || FALLBACK_IMG}
            alt={product.product_name}
            loading="lazy"
            className="w-100 h-100"
            style={{ objectFit: "cover" }}
            onError={() => setImgSrc(FALLBACK_IMG)}
          />
        </div>
      </div>

      <div className="card-body d-flex flex-column">
        <h5 className="card-title fw-bold mb-2">{product.product_name}</h5>
        <p className="text-muted mb-2">
          <small>
            <strong>Brand:</strong> {product.brand || "N/A"}
          </small>
        </p>

        <div className="mb-3">
          {isOutOfStock ? (
            <span className="badge bg-danger">Out of Stock</span>
          ) : isLowStock ? (
            <span className="badge bg-warning text-dark">⚠️ Only {stock} left!</span>
          ) : (
            <span className="badge bg-success">✓ In Stock: {stock}</span>
          )}
        </div>

        <div className="mb-3">
          <h4 className="text-primary mb-0 fw-bold">₹{Number(product.unit_price).toFixed(2)}</h4>
          <small className="text-muted">per unit</small>
        </div>

        {quantityInCart > 0 && (
          <div className="alert alert-info py-2 mb-3">
            <small>
              <strong>✓ {quantityInCart}</strong> in cart
            </small>
          </div>
        )}

        <button
          className={`btn btn-lg w-100 mt-auto ${
            isOutOfStock || !isCustomer ? "btn-secondary" : "btn-primary"
          }`}
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding || !isCustomer}
          title={!isCustomer ? "Only customers can add items to cart" : undefined}
        >
          {adding ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Adding...
            </>
          ) : isOutOfStock ? (
            <>🚫 Out of Stock</>
          ) : !isCustomer ? (
            <>🔒 Customers Only</>
          ) : (
            <>🛒 Add to Cart</>
          )}
        </button>

        {product.supplier_name && (
          <div className="mt-2 text-center">
            <small className="text-muted">Supplier: {product.supplier_name}</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
