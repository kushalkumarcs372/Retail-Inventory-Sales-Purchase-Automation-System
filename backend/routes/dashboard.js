import express from "express";
import db from "../db/connection.js";
import { verifyToken } from "./auth.js";

const router = express.Router();

/** ---- Role Guard for staff-only dashboard endpoints ---- */
const ALLOWED_STAFF = ["Admin", "Manager", "Cashier"];
const allowDashboardRoles = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (!ALLOWED_STAFF.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Dashboard allowed only for staff roles",
    });
  }
  next();
};

/** ============================
 * STAFF-ONLY DASHBOARD METRICS
 * ============================ */
router.get("/stats", verifyToken, allowDashboardRoles, async (_req, res) => {
  try {
    const [revenueResults] = await db
      .promise()
      .query("SELECT IFNULL(SUM(amount_paid), 0) as total_revenue FROM Sales");

    const [productsResults] = await db
      .promise()
      .query("SELECT COUNT(*) as total_products FROM Product");

    const [customersResults] = await db
      .promise()
      .query("SELECT COUNT(*) as total_customers FROM Customer");

    const [salesResults] = await db
      .promise()
      .query("SELECT COUNT(*) as total_sales FROM Sales");

    const [todayResults] = await db
      .promise()
      .query(
        `SELECT COUNT(*) as today_sales, IFNULL(SUM(amount_paid), 0) as today_revenue 
         FROM Sales WHERE DATE(sale_date) = CURDATE()`
      );

    const [lowStockResults] = await db
      .promise()
      .query("SELECT COUNT(*) as low_stock_products FROM Product WHERE stock < 50");

    const stats = {
      total_revenue: parseFloat(revenueResults[0].total_revenue || 0),
      total_products: Number(productsResults[0].total_products || 0),
      total_customers: Number(customersResults[0].total_customers || 0),
      total_sales: Number(salesResults[0].total_sales || 0),
      today_sales: Number(todayResults[0].today_sales || 0),
      today_revenue: parseFloat(todayResults[0].today_revenue || 0),
      low_stock_products: Number(lowStockResults[0].low_stock_products || 0),
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error("dashboard/stats error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard statistics" });
  }
});

router.get(
  "/recent-sales",
  verifyToken,
  allowDashboardRoles,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const query = `
        SELECT s.sale_id, s.sale_date, s.amount_paid, s.payment_mode,
               CONCAT(c.first_name, ' ', c.last_name) as customer_name,
               CONCAT(e.first_name, ' ', e.last_name) as employee_name
        FROM Sales s
        LEFT JOIN Customer c ON s.customer_id = c.customer_id
        LEFT JOIN Employee e ON s.employee_id = e.employee_id
        ORDER BY s.sale_date DESC, s.sale_id DESC
        LIMIT ?`;
      const [results] = await db.promise().query(query, [limit]);
      res.json({ success: true, sales: results });
    } catch (error) {
      console.error("dashboard/recent-sales error:", error);
      res.status(500).json({ success: false, message: "Failed recent sales" });
    }
  }
);

router.get(
  "/sales-chart",
  verifyToken,
  allowDashboardRoles,
  async (_req, res) => {
    try {
      const query = `
        SELECT DATE(sale_date) as date, COUNT(*) as sales_count, SUM(amount_paid) as revenue
        FROM Sales
        WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(sale_date)
        ORDER BY date ASC`;
      const [results] = await db.promise().query(query);
      res.json({ success: true, data: results });
    } catch (error) {
      console.error("dashboard/sales-chart error:", error);
      res.status(500).json({ success: false, message: "Failed sales chart" });
    }
  }
);

router.get(
  "/top-products",
  verifyToken,
  allowDashboardRoles,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const query = `
        SELECT p.product_id, p.product_name, p.brand, p.unit_price, p.stock, p.image_url,
               SUM(sp.quantity) as total_sold,
               SUM(sp.quantity * sp.unit_price) as total_revenue
        FROM Sales_Product sp
        JOIN Product p ON sp.product_id = p.product_id
        GROUP BY p.product_id, p.product_name, p.brand, p.unit_price, p.stock, p.image_url
        ORDER BY total_sold DESC
        LIMIT ?`;
      const [results] = await db.promise().query(query, [limit]);
      res.json({ success: true, products: results });
    } catch (error) {
      console.error("dashboard/top-products error:", error);
      res.status(500).json({ success: false, message: "Failed top products" });
    }
  }
);

/** ===========================================
 *  PUBLIC (AUTH-ONLY) RECOMMENDATIONS (W30/A3)
 *  Accessible to any logged-in user (Customer or Staff)
 *  Logic:
 *    1) If Customer has W30 purchase history → pick his top category,
 *       then return top 6 sold products in that category in W30
 *    2) Else → global top 6 sold products in W30
 *    3) Else → random 6 in-stock products
 * =========================================== */
router.get("/recommended", verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const WINDOW = "s.sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";

    // Helper: exec query
    const q = async (sql, params = []) => (await db.promise().query(sql, params))[0];

    // Step 1: personal category (only for Customer type)
    let products = [];
    if (req.user?.type === "customer") {
      const topCatRows = await q(
        `
        SELECT p.category, SUM(sp.quantity) AS qty
        FROM Sales s
        JOIN Sales_Product sp ON s.sale_id = sp.sale_id
        JOIN Product p ON p.product_id = sp.product_id
        WHERE s.customer_id = ? AND ${WINDOW} AND p.category IS NOT NULL
        GROUP BY p.category
        ORDER BY qty DESC
        LIMIT 1
        `,
        [req.user.id]
      );

      if (topCatRows.length > 0 && topCatRows[0].category) {
        const cat = topCatRows[0].category;
        products = await q(
          `
          SELECT p.product_id, p.product_name, p.brand, p.unit_price, p.stock, p.image_url,
                 SUM(sp.quantity) AS total_sold
          FROM Sales_Product sp
          JOIN Sales s ON s.sale_id = sp.sale_id
          JOIN Product p ON p.product_id = sp.product_id
          WHERE ${WINDOW} AND p.category = ?
          GROUP BY p.product_id, p.product_name, p.brand, p.unit_price, p.stock, p.image_url
          ORDER BY total_sold DESC
          LIMIT ?
          `,
          [cat, limit]
        );
      }
    }

    // Step 2: global top W30 if personal is empty
    if (!products || products.length === 0) {
      products = await q(
        `
        SELECT p.product_id, p.product_name, p.brand, p.unit_price, p.stock, p.image_url,
               SUM(sp.quantity) AS total_sold
        FROM Sales_Product sp
        JOIN Sales s ON s.sale_id = sp.sale_id
        JOIN Product p ON p.product_id = sp.product_id
        WHERE ${WINDOW}
        GROUP BY p.product_id, p.product_name, p.brand, p.unit_price, p.stock, p.image_url
        ORDER BY total_sold DESC
        LIMIT ?
        `,
        [limit]
      );
    }

    // Step 3: random fallback if still empty (e.g., no sales yet)
    if (!products || products.length === 0) {
      products = await q(
        `
        SELECT p.product_id, p.product_name, p.brand, p.unit_price, p.stock, p.image_url
        FROM Product p
        WHERE p.stock > 0
        ORDER BY RAND()
        LIMIT ?
        `,
        [limit]
      );
    }

    res.json({ success: true, products });
  } catch (err) {
    console.error("dashboard/recommended error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch recommendations" });
  }
});

export default router;
