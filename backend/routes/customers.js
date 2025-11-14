import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// ✅ Get all customers (admin)
router.get("/", async (req, res) => {
  try {
    const [customers] = await db.promise().query(`
      SELECT c.customer_id, c.first_name, c.middle_name, c.last_name, c.phone,
             ce.email, m.type as membership_type
      FROM Customer c
      LEFT JOIN Customer_Email ce ON c.customer_id = ce.customer_id
      LEFT JOIN (
        SELECT customer_id, type, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY end_date DESC) as rn
        FROM Membership
        WHERE end_date >= CURDATE()
      ) m ON c.customer_id = m.customer_id AND m.rn = 1
      GROUP BY c.customer_id
      ORDER BY c.customer_id DESC
    `);

    res.json(customers);
  } catch (err) {
    console.error("❌ Error fetching customers:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// ✅ Get customer by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [customers] = await db.promise().query(`
      SELECT c.*, ce.email
      FROM Customer c
      LEFT JOIN Customer_Email ce ON c.customer_id = ce.customer_id
      WHERE c.customer_id = ?
      LIMIT 1
    `, [id]);

    if (customers.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Remove password from response
    const customer = customers[0];
    delete customer.password;

    res.json(customer);
  } catch (err) {
    console.error("❌ Error fetching customer:", err);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

export default router;