import React from "react";
import { useNavigate } from "react-router-dom";

function Bill({ billData }) {
  const navigate = useNavigate();

  if (!billData) {
    return (
      <div className="container mt-5 text-center">
        <p>Loading bill...</p>
      </div>
    );
  }

  const { bill, items } = billData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Action Buttons */}
          <div className="mb-3 d-print-none">
            <button className="btn btn-outline-primary me-2" onClick={() => navigate("/bills")}>
              <i className="bi bi-arrow-left me-2"></i>
              Back to Bills
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <i className="bi bi-printer me-2"></i>
              Print Bill
            </button>
          </div>

          {/* Bill Card */}
          <div className="card border-0 shadow-lg">
            <div className="card-body p-5">
              {/* Header */}
              <div className="text-center mb-5 pb-4 border-bottom">
                <h1 className="display-4 fw-bold mb-2">🏪 Metro Cash & Carry</h1>
                <p className="text-muted mb-1">Professional Cash & Carry Services</p>
                <p className="text-muted mb-0">📍 123 Business Street, Chennai, TN 600001</p>
                <p className="text-muted">📞 +91 98765 43210 | ✉️ info@metro.com</p>
              </div>

              {/* Bill Info */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <h5 className="fw-bold mb-3">Bill Information</h5>
                  <p className="mb-1">
                    <strong>Bill ID:</strong> #{bill.bill_id}
                  </p>
                  <p className="mb-1">
                    <strong>Sale ID:</strong> #{bill.sale_id}
                  </p>
                  <p className="mb-1">
                    <strong>Date:</strong> {new Date(bill.bill_date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                <div className="col-md-6 text-md-end">
                  <h5 className="fw-bold mb-3">Customer Details</h5>
                  <p className="mb-1">
                    <strong>Name:</strong> {bill.customer_name}
                  </p>
                  <p className="mb-1">
                    <strong>GSTIN:</strong> N/A
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="table-responsive mb-4">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Product Name</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Unit Price</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.product_id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="fw-bold">{item.product_name}</div>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-primary">{item.quantity}</span>
                        </td>
                        <td className="text-end">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td className="text-end fw-bold">₹{parseFloat(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="row">
                <div className="col-md-6 ms-auto">
                  <div className="bg-light p-4 rounded">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <span>₹{parseFloat(bill.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tax (0%):</span>
                      <span>₹0.00</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Discount:</span>
                      <span className="text-success">-₹0.00</span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <h5 className="fw-bold mb-0">Grand Total:</h5>
                      <h5 className="fw-bold mb-0 text-primary">
                        ₹{parseFloat(bill.total_amount).toFixed(2)}
                      </h5>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-4 border-top text-center">
                <p className="text-muted mb-2">Thank you for shopping with Metro Cash & Carry!</p>
                <p className="text-muted small mb-0">
                  For any queries, please contact us at support@metro.com
                </p>
                <div className="mt-3">
                  <small className="text-muted">This is a computer-generated bill and does not require a signature.</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .card, .card * {
            visibility: visible;
          }
          .card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
          }
          .d-print-none {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Bill;
