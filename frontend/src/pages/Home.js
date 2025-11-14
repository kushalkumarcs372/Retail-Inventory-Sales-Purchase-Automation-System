import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";

function Home() {
  const { user } = useAuth();
  const role = user?.role || "Customer"; // default safe
  const isStaff = role === "Admin" || role === "Manager" || role === "Cashier";
  const isCustomer = role === "Customer";

  // staff dashboard state
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // customer recommendations
  const [recommended, setRecommended] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async function load() {
      try {
        if (isStaff) {
          // staff: fetch analytics
          const [statsRes, salesRes, productsRes] = await Promise.all([
            API.get("/dashboard/stats"),
            API.get("/dashboard/recent-sales?limit=5"),
            API.get("/dashboard/top-products?limit=5"),
          ]);

          if (statsRes.data.success && statsRes.data.stats) setStats(statsRes.data.stats);
          if (salesRes.data.success && salesRes.data.sales) setRecentSales(salesRes.data.sales);
          if (productsRes.data.success && productsRes.data.products)
            setTopProducts(productsRes.data.products);
        } else {
          // customer: fetch recommendations (limit 6)
          const { data } = await API.get("/dashboard/recommended?limit=6");
          if (data.success && Array.isArray(data.products)) {
            setRecommended(data.products);
          } else {
            setRecommended([]);
          }
        }
      } catch (err) {
        console.error("Home load error:", err);
        if (isStaff) {
          setStats({
            total_revenue: 0,
            total_products: 0,
            total_customers: 0,
            total_sales: 0,
            low_stock_products: 0,
          });
          setRecentSales([]);
          setTopProducts([]);
        } else {
          setRecommended([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isStaff]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">{isStaff ? "Loading dashboard..." : "Loading recommendations..."}</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Hero Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div
            className="card border-0 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <div className="card-body p-5">
              <h1 className="display-4 fw-bold mb-3">🏪 Metro Cash & Carry</h1>
              <p className="lead mb-4">
                {isStaff ? "Operations Dashboard & Analytics" : "Shop curated picks and see your bills"}
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/products" className="btn btn-light btn-lg px-4">
                  🛒 Browse Products
                </Link>
                <Link to="/bills" className="btn btn-outline-light btn-lg px-4">
                  {isCustomer ? "📄 My Bills" : "📄 Bills"}
                </Link>
                <Link to="/membership" className="btn btn-warning btn-lg px-4">
                  👑 Get Membership
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STAFF VIEW: Analytics */}
      {isStaff && stats && (
        <>
          {/* Statistics Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Total Revenue</p>
                      <h3 className="mb-0">
                        ₹
                        {parseFloat(stats.total_revenue || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </h3>
                    </div>
                    <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                      <span style={{ fontSize: "2rem" }}>💰</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Total Products</p>
                      <h3 className="mb-0">{stats.total_products || 0}</h3>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                      <span style={{ fontSize: "2rem" }}>📦</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Total Customers</p>
                      <h3 className="mb-0">{stats.total_customers || 0}</h3>
                    </div>
                    <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                      <span style={{ fontSize: "2rem" }}>👥</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1">Total Sales</p>
                      <h3 className="mb-0">{stats.total_sales || 0}</h3>
                    </div>
                    <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                      <span style={{ fontSize: "2rem" }}>📊</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sales and Top Products */}
          <div className="row g-4">
            <div className="col-md-7">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0 fw-bold">📋 Recent Sales</h5>
                </div>
                <div className="card-body">
                  {!recentSales || recentSales.length === 0 ? (
                    <div className="text-center py-5">
                      <span style={{ fontSize: "3rem" }}>🛒</span>
                      <p className="text-muted mt-3">No sales yet.</p>
                      <Link to="/products" className="btn btn-primary">
                        Go to Products
                      </Link>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Sale ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentSales.map((sale) => (
                            <tr key={sale.sale_id}>
                              <td className="fw-bold">#{sale.sale_id}</td>
                              <td>{sale.customer_name || "Guest"}</td>
                              <td className="text-success fw-bold">
                                ₹{parseFloat(sale.amount_paid || 0).toFixed(2)}
                              </td>
                              <td>
                                {new Date(sale.sale_date).toLocaleDateString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0 fw-bold">🏆 Top Selling Products</h5>
                </div>
                <div className="card-body">
                  {!topProducts || topProducts.length === 0 ? (
                    <div className="text-center py-5">
                      <span style={{ fontSize: "3rem" }}>📦</span>
                      <p className="text-muted mt-3">No sales data available yet</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {topProducts.map((product, index) => (
                        <div key={product.product_id || index} className="list-group-item border-0 px-0 py-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-1">
                                <span className="badge bg-primary me-2">#{index + 1}</span>
                                <h6 className="mb-0">{product.product_name}</h6>
                              </div>
                              <small className="text-muted">{product.brand}</small>
                            </div>
                            <div className="text-end ms-3">
                              <div className="fw-bold text-primary">{product.total_sold} units</div>
                              <small className="text-success">
                                ₹{parseFloat(product.total_revenue || 0).toLocaleString("en-IN")}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          {stats && stats.low_stock_products > 0 && (
            <div className="row mt-4">
              <div className="col-12">
                <div
                  className="alert alert-warning border-0 shadow-sm d-flex align-items-center"
                  role="alert"
                >
                  <span style={{ fontSize: "2rem" }} className="me-3">
                    ⚠️
                  </span>
                  <div>
                    <strong>Low Stock Alert!</strong> {stats.low_stock_products} product(s) need
                    restocking (below 50 units).
                    <Link to="/products" className="alert-link ms-2">
                      View Products →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* CUSTOMER VIEW: Recommended For You */}
      {isCustomer && (
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">✨ Recommended for you</h5>
                <Link to="/products" className="btn btn-sm btn-outline-primary">
                  View All Products
                </Link>
              </div>
              <div className="card-body">
                {!recommended || recommended.length === 0 ? (
                  <div className="text-center py-5">
                    <span style={{ fontSize: "3rem" }}>🛍️</span>
                    <p className="text-muted mt-3">No recommendations yet.</p>
                    <Link to="/products" className="btn btn-primary">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="row g-4">
                    {recommended.map((p) => (
                      <div key={p.product_id} className="col-md-6 col-lg-4 col-xl-3">
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
