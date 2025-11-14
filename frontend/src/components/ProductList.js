import React, { useEffect, useState } from "react";
import API from "../api";
import { useCart } from "../context/CartContext";

function ProductList() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    API.get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">
        <i className="bi bi-cart4"></i> Available Products
      </h2>
      <div className="row">
        {products.map((p) => (
          <div className="col-md-4 mb-4" key={p.product_id}>
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">{p.product_name}</h5>
                <p>Brand: {p.brand}</p>
                <p>Stock: {p.stock}</p>
                <p>Price: ₹{p.quantity}</p>
                <button
                  className="btn btn-primary w-100"
                  onClick={() => addToCart(p)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;
