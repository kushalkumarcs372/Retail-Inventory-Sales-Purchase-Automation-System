// src/pages/DashboardPage.js
// Requires: npm i apexcharts react-apexcharts
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import API from "../api";
import { useAuth } from "../context/AuthContext";

function StatCard({ icon, label, value, accent = "primary", sub }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <p className="text-muted mb-1">{label}</p>
            <h3 className="mb-0">{value}</h3>
            {sub ? <small className="text-muted">{sub}</small> : null}
          </div>
          <div className={`p-3 rounded-circle bg-${accent} bg-opacity-10`}>
            <span style={{ fontSize: "2rem" }}>{icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [salesSeries, setSalesSeries] = useState([]);
  const [salesCategories, setSalesCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  // Role guard: only Admin/Manager/Cashier
  const isStaff = useMemo(() => {
    const r = (user?.role || "").toLowerCase();
    return r === "admin" || r === "manager" || r === "cashier";
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !isStaff) {
      // Not allowed → bounce home
      navigate("/");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        const [statsRes, chartRes, topRes, recentRes] = await Promise.all([
          API.get("/dashboard/stats"),
          API.get("/dashboard/sales-chart"),
          API.get("/dashboard/top-products?limit=6"),
          API.get("/dashboard/recent-sales?limit=8"),
        ]);

        // Stats
        setStats(statsRes.data?.stats || null);

        // Sales chart (last 7 days)
        const rows = chartRes.data?.data || [];
        setSalesCategories(rows.map((r) => r.date));
        setSalesSeries([
          {
            name: "Orders",
            data: rows.map((r) => Number(r.sales_count || 0)),
          },
          {
            name: "Revenue",
            data: rows.map((r) => Number(r.revenue || 0)),
          },
        ]);

        // Top products (for donut/pie)
        setTopProducts(topRes.data?.products || []);

        // Recent sales table
        setRecentSales(recentRes.data?.sales || []);
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, isStaff, navigate, user]);

  // Apex options
  const ordersRevenueOptions = useMemo(
    () => ({
      chart: { type: "bar", toolbar: { show: false } },
      stroke: { show: true, width: 2 },
      dataLabels: { enabled: false },
      xaxis: {
        categories: salesCategories,
        labels: { rotate: -30 },
      },
      yaxis: [
        {
          title: { text: "Orders" },
          labels: { formatter: (v) => Math.round(v) },
        },
        {
          opposite: true,
          title: { text: "Revenue (₹)" },
          labels: { formatter: (v) => `₹${Math.round(v)}` },
        },
      ],
      plotOptions: {
        bar: { columnWidth: "45%", borderRadius: 6 },
      },
      tooltip: {
        shared: true,
        y: [
          { formatter: (v) => `${v} orders` },
          { formatter: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
        ],
      },
      colors: ["#4f46e5", "#10b981"],
    }),
    [salesCategories]
  );

  const donutOptions = useMemo(() => {
    const names = topProducts.map((p) => p.product_name);
    return {
      chart: { type: "donut" },
      labels: names,
      legend: { position: "bottom" },
      dataLabels: { enabled: true },
      tooltip: {
        y: {
          formatter: (v, { seriesIndex }) => {
            const units = topProducts[seriesIndex]?.total_sold || 0;
            const rev = topProducts[seriesIndex]?.total_revenue || 0;
            return `${units} units • ₹${Number(rev).toLocaleString("en-IN")}`;
          },
        },
      },
      colors: ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
    };
  }, [topProducts]);

  const donutSeries = useMemo(
    () => topProducts.map((p) => Number(p.total_sold || 0)),
    [topProducts]
  );

  if (authLoading || loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="mt-3 text-muted">Loading dashboard…</p>
      </div>
    );
  }

  if (!isStaff) return null;

  return (
    <div
      className="container-fluid py-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div
            className="card border-0 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <div className="card-body p-4">
              <h2 className="mb-2 fw-bold">
                <span style={{ fontSize: "1.5rem" }}>📊</span> Staff Dashboard
              </h2>
              <p className="mb-0 opacity-75">
                Overview of sales, products, and customers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <StatCard
              icon="💰"
              label="Total Revenue"
              value={`₹${Number(
                stats.total_revenue || 0
              ).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
              accent="success"
            />
          </div>
          <div className="col-md-3">
            <StatCard
              icon="📦"
              label="Total Products"
              value={stats.total_products || 0}
              accent="primary"
            />
          </div>
          <div className="col-md-3">
            <StatCard
              icon="👥"
              label="Total Customers"
              value={stats.total_customers || 0}
              accent="info"
            />
          </div>
          <div className="col-md-3">
            <StatCard
              icon="🧾"
              label="Total Sales"
              value={stats.total_sales || 0}
              accent="warning"
            />
          </div>

          <div className="col-md-3">
            <StatCard
              icon="📈"
              label="Today’s Sales"
              value={stats.today_sales || 0}
              accent="secondary"
            />
          </div>
          <div className="col-md-3">
            <StatCard
              icon="🏦"
              label="Today’s Revenue"
              value={`₹${Number(
                stats.today_revenue || 0
              ).toLocaleString("en-IN")}`}
              accent="success"
            />
          </div>
          <div className="col-md-3">
            <StatCard
              icon="⚠️"
              label="Low Stock Products"
              value={stats.low_stock_products || 0}
              accent="danger"
              sub="Below threshold 50"
            />
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Sales & Revenue (Last 7 Days)</h5>
            </div>
            <div className="card-body">
              {salesCategories.length === 0 ? (
                <div className="text-center py-5 text-muted">No data</div>
              ) : (
                <ReactApexChart
                  options={ordersRevenueOptions}
                  series={[
                    { ...salesSeries[0], type: "column" },
                    { ...salesSeries[1], type: "line" },
                  ]}
                  type="line"
                  height={360}
                />
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Top Products (Units Sold)</h5>
            </div>
            <div className="card-body">
              {donutSeries.length === 0 ? (
                <div className="text-center py-5 text-muted">No data</div>
              ) : (
                <ReactApexChart
                  options={donutOptions}
                  series={donutSeries}
                  type="donut"
                  height={360}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="row g-4 mt-1">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Recent Sales</h5>
            </div>
            <div className="card-body p-0">
              {(!recentSales || recentSales.length === 0) ? (
                <div className="text-center py-5 text-muted">No recent sales</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4 py-3">Sale ID</th>
                        <th className="py-3">Customer</th>
                        <th className="py-3">Amount</th>
                        <th className="py-3">Payment</th>
                        <th className="py-3">Date</th>
                        <th className="py-3">Handled By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map((s) => (
                        <tr key={s.sale_id}>
                          <td className="px-4 py-3">
                            <span className="badge bg-primary">#{s.sale_id}</span>
                          </td>
                          <td className="py-3">{s.customer_name || "—"}</td>
                          <td className="py-3 text-success fw-bold">
                            ₹{Number(s.amount_paid || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3">{s.payment_mode}</td>
                          <td className="py-3">
                            {new Date(s.sale_date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-3">{s.employee_name || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
