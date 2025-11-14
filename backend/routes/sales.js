import express from "express";
import db from "../db/connection.js";

const router = express.Router();

// ✅ Get all sales
router.get("/", (req, res) => {
  db.query("SELECT * FROM sales", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ✅ Get total revenue
router.get("/revenue", (req, res) => {
  db.query("SELECT SUM(amount_paid) AS total_revenue FROM sales", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result[0]);
  });
});

export default router;
