import React, { useEffect, useState, useCallback } from "react";
import API from "../api";
import ProductCard from "../components/ProductCard";

function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStock, setFilterStock] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const filterProducts = useCallback(() => {
    let filtered = [...products];

    // search
    if (searchTerm.trim().length > 0) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q)
      );
    }

    // stock filter
    if (filterStock === "instock") filtered = filtered.filter((p) => p.stock > 0);
    if (filterStock === "outofstock") filtered = filtered.filter((p) => p.stock === 0);
    if (filterStock === "lowstock") filtered = filtered.filter((p) => p.stock > 0 && p.stock < 10);

    setFilteredProducts(filtered);
  }, [products, searchTerm, filterStock]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get("/products");
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h2 className="mb-3 fw-bold">
                <span style={{ fontSize: "1.5rem" }}>📦</span> Products Catalog
              </h2>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search products by name or brand..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={filterStock}
                    onChange={(e) => setFilterStock(e.target.value)}
                  >
                    <option value="all">All Products</option>
                    <option value="instock">In Stock</option>
                    <option value="lowstock">Low Stock</option>
                    <option value="outofstock">Out of Stock</option>
                  </select>
                </div>

                <div className="col-md-3 d-flex align-items-center h-100">
                  <span className="badge bg-primary me-2">{filteredProducts.length} Products</span>
                  {searchTerm && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* GRID */}
      {filteredProducts.length === 0 ? (
        <div className="text-center mt-5">
          <h4 className="text-muted">No products found</h4>
        </div>
      ) : (
        <div className="row g-4">
          {filteredProducts.map((product) => (
            <div key={product.product_id} className="col-md-6 col-lg-4 col-xl-3">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;
