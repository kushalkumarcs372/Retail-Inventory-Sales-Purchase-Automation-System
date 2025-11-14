import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api";
import Bill from "../components/Bill";

function BillsPage() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(billId ? "detail" : "list");

  const fetchBillDetail = useCallback(async (id) => {
    try {
      const res = await API.get(`/bills/${id}`);
      setSelectedBill(res.data);
      setViewMode("detail");
    } catch (err) {
      console.error("Error fetching bill:", err);
      alert("Bill not found!");
      navigate("/bills");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (billId) {
      fetchBillDetail(billId);
    } else {
      fetchAllBills();
    }
  }, [billId, fetchBillDetail]);

  const fetchAllBills = async () => {
    try {
      const res = await API.get("/bills");
      setBills(res.data);
    } catch (err) {
      console.error("Error fetching bills:", err);
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component remains the same...
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (viewMode === "detail" && selectedBill) {
    return <Bill billData={selectedBill} />;
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h2 className="mb-0 fw-bold">
                <span style={{ fontSize: "1.5rem" }}>📄</span> Bills & Invoices
              </h2>
              <p className="text-muted mb-0">View all your transaction history</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div style={{ fontSize: "5rem", opacity: 0.3 }}>📄</div>
                <h4 className="text-muted mb-3">No bills found</h4>
                <p className="text-muted mb-4">Start shopping to generate bills</p>
                <Link to="/products" className="btn btn-primary">
                  Browse Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4 py-3">Bill ID</th>
                        <th className="py-3">Date</th>
                        <th className="py-3">Customer</th>
                        <th className="py-3">Amount</th>
                        <th className="py-3">Sale ID</th>
                        <th className="py-3 text-end pe-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((bill) => (
                        <tr key={bill.bill_id}>
                          <td className="px-4 py-3">
                            <span className="badge bg-primary">#{bill.bill_id}</span>
                          </td>
                          <td className="py-3">
                            {new Date(bill.bill_date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-3">{bill.customer_name}</td>
                          <td className="py-3">
                            <span className="fw-bold text-success">
                              ₹{parseFloat(bill.total_amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3">#{bill.sale_id}</td>
                          <td className="py-3 text-end pe-4">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                fetchBillDetail(bill.bill_id);
                                navigate(`/bills/${bill.bill_id}`);
                              }}
                            >
                              View Details →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="row mt-4">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center">
                    <h6 className="text-muted">Total Bills</h6>
                    <h3 className="mb-0">{bills.length}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center">
                    <h6 className="text-muted">Total Revenue</h6>
                    <h3 className="mb-0">
                      ₹{bills.reduce((sum, b) => sum + parseFloat(b.total_amount), 0).toFixed(2)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center">
                    <h6 className="text-muted">Average Bill Value</h6>
                    <h3 className="mb-0">
                      ₹{(bills.reduce((sum, b) => sum + parseFloat(b.total_amount), 0) / bills.length).toFixed(2)}
                    </h3>
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

export default BillsPage;
