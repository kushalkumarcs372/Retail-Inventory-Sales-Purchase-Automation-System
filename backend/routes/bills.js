// routes/bills.js
import express from "express";
import db from "../db/connection.js";
import { verifyToken } from "./auth.js";

const router = express.Router();

// Allowed DASHBOARD type roles
const ALLOWED_STAFF = ["Admin", "Manager", "Cashier"];

const allowStaff = (req) => {
  return ALLOWED_STAFF.includes(req.user.role);
};

/**
 * 📄 GET all bills (role filtered)
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    let query;
    let params = [];

    if (allowStaff(req)) {
      // staff see ALL
      query = `
        SELECT b.bill_id, b.bill_date, b.total_amount,
               CONCAT(c.first_name,' ',c.last_name) AS customer_name,
               s.sale_id
        FROM Bill b
        JOIN Sales s ON b.sale_id = s.sale_id
        JOIN Customer c ON s.customer_id = c.customer_id
        ORDER BY b.bill_date DESC
      `;
    } else {
      // customer sees only his bills
      query = `
        SELECT b.bill_id, b.bill_date, b.total_amount,
               CONCAT(c.first_name,' ',c.last_name) AS customer_name,
               s.sale_id
        FROM Bill b
        JOIN Sales s ON b.sale_id = s.sale_id
        JOIN Customer c ON s.customer_id = c.customer_id
        WHERE c.customer_id = ?
        ORDER BY b.bill_date DESC
      `;
      params = [req.user.id];
    }

    const [results] = await db.promise().query(query, params);
    res.json(results);

  } catch (err) {
    console.error("bill fetch err:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📄 GET bill details by bill_id (role filtered)
 */
router.get("/:bill_id", verifyToken, async (req, res) => {
  try {
    const { bill_id } = req.params;

    const billQuery = `
      SELECT b.bill_id, b.bill_date, b.total_amount,
             c.customer_id,
             CONCAT(c.first_name,' ',c.last_name) AS customer_name, s.sale_id
      FROM Bill b
      JOIN Sales s ON b.sale_id = s.sale_id
      JOIN Customer c ON s.customer_id = c.customer_id
      WHERE b.bill_id = ?
    `;

    const [bill] = await db.promise().query(billQuery, [bill_id]);
    if (bill.length === 0) return res.status(404).json({ message:"Bill not found" });

    // RBAC check here
    if (!allowStaff(req)) {
      if (bill[0].customer_id !== req.user.id)
        return res.status(403).json({ message:"Not allowed to view this bill" });
    }

    const itemsQuery = `
      SELECT bi.product_id, p.product_name, bi.quantity, bi.unit_price,
             (bi.quantity * bi.unit_price) AS total
      FROM Bill_Item bi
      JOIN Product p ON bi.product_id = p.product_id
      WHERE bi.bill_id = ?
    `;

    const [items] = await db.promise().query(itemsQuery, [bill_id]);

    res.json({
      bill: bill[0],
      items
    });

  } catch (err) {
    console.error("bill detail err:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🧾 POST create bill (only staff allowed)
 */
router.post("/", verifyToken, async (req, res) => {
  if (!allowStaff(req)) {
    return res.status(403).json({ message: "Only staff members can generate bills" });
  }

  const { sale_id, total_amount } = req.body;

  try {
    const query = `
      INSERT INTO Bill (sale_id, bill_date, total_amount)
      VALUES (?, CURDATE(), ?);
    `;
    const [result] = await db.promise().query(query, [sale_id, total_amount]);

    res.json({
      message: "✅ Bill generated successfully",
      bill_id: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
