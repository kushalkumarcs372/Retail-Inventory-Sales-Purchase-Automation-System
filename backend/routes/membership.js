import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// Membership pricing plans
const MEMBERSHIP_PLANS = {
  Silver: { price: 499, duration: 365, discount: 5 },
  Gold: { price: 999, duration: 365, discount: 10 },
  Platinum: { price: 1999, duration: 365, discount: 15 }
};

// ✅ Get customer's current membership
router.get("/:customer_id", async (req, res) => {
  const { customer_id } = req.params;

  console.log(`🔍 Fetching membership for customer: ${customer_id}`);

  try {
    const [membership] = await db.promise().query(
      `SELECT m.*, 
              DATEDIFF(m.end_date, CURDATE()) AS days_remaining,
              CASE 
                WHEN m.end_date < CURDATE() THEN 'Expired'
                WHEN DATEDIFF(m.end_date, CURDATE()) <= 30 THEN 'Expiring Soon'
                ELSE 'Active'
              END AS status
       FROM Membership m
       WHERE m.customer_id = ?
       ORDER BY m.membership_id DESC
       LIMIT 1`,
      [customer_id]
    );

    if (membership.length === 0) {
      console.log(`ℹ️ No membership found for customer ${customer_id}`);
      return res.json({ 
        hasMembership: false, 
        message: "No active membership found" 
      });
    }

    console.log(`✅ Found membership:`, membership[0]);

    res.json({
      hasMembership: true,
      membership: membership[0]
    });
  } catch (err) {
    console.error("❌ Error fetching membership:", err);
    res.status(500).json({ error: "Failed to fetch membership" });
  }
});

// ✅ Get all available membership plans
router.get("/plans/all", async (req, res) => {
  try {
    const plans = Object.entries(MEMBERSHIP_PLANS).map(([type, details]) => ({
      type,
      price: details.price,
      duration: details.duration,
      discount: details.discount,
      features: [
        `${details.discount}% discount on all purchases`,
        "Priority customer support",
        type === "Platinum" ? "Free home delivery" : "Reduced delivery charges",
        type !== "Silver" ? "Early access to sales" : null,
        type === "Platinum" ? "Exclusive member-only deals" : null
      ].filter(Boolean)
    }));

    console.log(`✅ Sending ${plans.length} membership plans`);
    res.json(plans);
  } catch (err) {
    console.error("❌ Error fetching plans:", err);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// ✅ Purchase/Upgrade membership
router.post("/purchase", async (req, res) => {
  const { customer_id, type, payment_mode } = req.body;

  console.log(`💳 Processing membership purchase:`, { customer_id, type, payment_mode });

  if (!customer_id || !type || !payment_mode) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ 
      error: "Customer ID, membership type, and payment mode are required" 
    });
  }

  // Validate membership type
  if (!MEMBERSHIP_PLANS[type]) {
    console.log("❌ Invalid membership type:", type);
    return res.status(400).json({ 
      error: "Invalid membership type. Choose Silver, Gold, or Platinum" 
    });
  }

  const plan = MEMBERSHIP_PLANS[type];

  try {
    // Check if customer exists
    const [customer] = await db.promise().query(
      "SELECT customer_id FROM Customer WHERE customer_id = ?",
      [customer_id]
    );

    if (customer.length === 0) {
      console.log("❌ Customer not found:", customer_id);
      return res.status(404).json({ error: "Customer not found" });
    }

    console.log(`✅ Customer exists: ${customer_id}`);

    // Check for existing active membership
    const [existingMembership] = await db.promise().query(
      `SELECT membership_id, type, end_date 
       FROM Membership 
       WHERE customer_id = ? AND end_date >= CURDATE()
       ORDER BY membership_id DESC 
       LIMIT 1`,
      [customer_id]
    );

    // Calculate dates
    const start_date = new Date();
    let end_date = new Date();
    end_date.setDate(end_date.getDate() + plan.duration);

    // If upgrading, extend from current end date
    if (existingMembership.length > 0) {
      const currentEndDate = new Date(existingMembership[0].end_date);
      console.log(`📝 Existing membership found, extending from: ${currentEndDate.toISOString().split('T')[0]}`);
      
      if (currentEndDate > start_date) {
        end_date = new Date(currentEndDate);
        end_date.setDate(end_date.getDate() + plan.duration);
      }
    }

    const startDateStr = start_date.toISOString().split('T')[0];
    const endDateStr = end_date.toISOString().split('T')[0];

    console.log(`📅 Membership dates:`, { 
      start_date: startDateStr, 
      end_date: endDateStr 
    });

    // Insert new membership
    const [result] = await db.promise().query(
      `INSERT INTO Membership (customer_id, type, start_date, end_date)
       VALUES (?, ?, ?, ?)`,
      [customer_id, type, startDateStr, endDateStr]
    );

    console.log(`✅ Membership created with ID: ${result.insertId}`);

    // Record the payment as a sale (for accounting)
    const [saleResult] = await db.promise().query(
      `INSERT INTO Sales (customer_id, employee_id, payment_mode, amount_paid, sale_date)
       VALUES (?, 1, ?, ?, CURDATE())`,
      [customer_id, payment_mode, plan.price]
    );

    console.log(`✅ Sale recorded with ID: ${saleResult.insertId}`);

    // Fetch the newly created membership to return complete data
    const [newMembership] = await db.promise().query(
      `SELECT m.*, 
              DATEDIFF(m.end_date, CURDATE()) AS days_remaining,
              'Active' AS status
       FROM Membership m
       WHERE m.membership_id = ?`,
      [result.insertId]
    );

    const responseData = {
      message: `✅ ${type} membership activated successfully!`,
      membership: {
        membership_id: result.insertId,
        customer_id: customer_id,
        type: type,
        start_date: startDateStr,
        end_date: endDateStr,
        discount: plan.discount,
        amount_paid: plan.price,
        payment_mode: payment_mode,
        status: 'Active',
        days_remaining: Math.floor((end_date - start_date) / (1000 * 60 * 60 * 24))
      }
    };

    console.log(`✅ Purchase successful:`, responseData);

    res.status(201).json(responseData);
  } catch (err) {
    console.error("❌ Error purchasing membership:", err);
    console.error("Error details:", err.message);
    res.status(500).json({ 
      error: "Failed to purchase membership. Please try again.",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ✅ Cancel membership (set end date to today)
router.delete("/cancel/:customer_id", async (req, res) => {
  const { customer_id } = req.params;

  console.log(`🗑️ Cancelling membership for customer: ${customer_id}`);

  try {
    const [result] = await db.promise().query(
      `UPDATE Membership 
       SET end_date = CURDATE() 
       WHERE customer_id = ? AND end_date >= CURDATE()`,
      [customer_id]
    );

    if (result.affectedRows === 0) {
      console.log(`⚠️ No active membership found to cancel`);
      return res.status(404).json({ 
        error: "No active membership found to cancel" 
      });
    }

    console.log(`✅ Membership cancelled for customer ${customer_id}`);

    res.json({ 
      message: "✅ Membership cancelled successfully" 
    });
  } catch (err) {
    console.error("❌ Error cancelling membership:", err);
    res.status(500).json({ error: "Failed to cancel membership" });
  }
});

// ✅ Get membership history for a customer
router.get("/history/:customer_id", async (req, res) => {
  const { customer_id } = req.params;

  console.log(`📜 Fetching membership history for customer: ${customer_id}`);

  try {
    const [history] = await db.promise().query(
      `SELECT m.*,
              DATEDIFF(m.end_date, m.start_date) AS duration_days,
              CASE 
                WHEN m.end_date < CURDATE() THEN 'Expired'
                WHEN DATEDIFF(m.end_date, CURDATE()) <= 30 THEN 'Expiring Soon'
                ELSE 'Active'
              END AS status
       FROM Membership m
       WHERE m.customer_id = ? 
       ORDER BY m.start_date DESC`,
      [customer_id]
    );

    console.log(`✅ Found ${history.length} membership records`);

    res.json(history);
  } catch (err) {
    console.error("❌ Error fetching membership history:", err);
    res.status(500).json({ error: "Failed to fetch membership history" });
  }
});

// ✅ Get membership statistics (admin)
router.get("/stats/all", async (req, res) => {
  console.log(`📊 Fetching membership statistics`);

  try {
    const [stats] = await db.promise().query(`
      SELECT 
        type,
        COUNT(*) AS total_members,
        SUM(CASE WHEN end_date >= CURDATE() THEN 1 ELSE 0 END) AS active_members,
        SUM(CASE WHEN end_date < CURDATE() THEN 1 ELSE 0 END) AS expired_members
      FROM Membership
      GROUP BY type
      ORDER BY 
        CASE type
          WHEN 'Platinum' THEN 1
          WHEN 'Gold' THEN 2
          WHEN 'Silver' THEN 3
        END
    `);

    console.log(`✅ Membership stats:`, stats);

    res.json(stats);
  } catch (err) {
    console.error("❌ Error fetching membership stats:", err);
    res.status(500).json({ error: "Failed to fetch membership stats" });
  }
});

// ✅ Check if customer has active membership (utility endpoint)
router.get("/check/:customer_id", async (req, res) => {
  const { customer_id } = req.params;

  try {
    const [membership] = await db.promise().query(
      `SELECT type, discount 
       FROM Membership 
       WHERE customer_id = ? AND end_date >= CURDATE()
       ORDER BY membership_id DESC 
       LIMIT 1`,
      [customer_id]
    );

    if (membership.length === 0) {
      return res.json({ 
        hasActiveMembership: false,
        discount: 0
      });
    }

    const plan = MEMBERSHIP_PLANS[membership[0].type];
    
    res.json({ 
      hasActiveMembership: true,
      type: membership[0].type,
      discount: plan.discount
    });
  } catch (err) {
    console.error("❌ Error checking membership:", err);
    res.status(500).json({ error: "Failed to check membership" });
  }
});

export default router;