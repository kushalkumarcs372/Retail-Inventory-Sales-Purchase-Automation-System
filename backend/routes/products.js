import express from "express";
import db from "../db/connection.js";
import multer from "multer";
import fs from "fs";

const router = express.Router();

/* -------- Multer Upload config -------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync("uploads/products")) fs.mkdirSync("uploads/products", { recursive: true });
    cb(null, "uploads/products");
  },
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${ts}-${safe}`);
  },
});
const upload = multer({ storage });

/* -------- Upload endpoint -------- */
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });
  const url = `/uploads/products/${req.file.filename}`;
  res.json({ url });
});

/* -------- Fetch all products -------- */
router.get("/", async (_req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT p.*, s.supplier_name, s.location AS supplier_location
      FROM Product p
      LEFT JOIN Supplier s ON p.supplier_id = s.supplier_id
      ORDER BY p.product_id
    `);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

export default router;
