import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { verifyToken } from "./routes/auth.js";  // ✅ added
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import salesRoutes from "./routes/sales.js";
import billsRoutes from "./routes/bills.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import customerRoutes from "./routes/customers.js";
import membershipRoutes from "./routes/membership.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Static for uploaded images
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/membership", membershipRoutes);

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// 404
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// global error handler
app.use((err, _req, res, _next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Metro Cash & Carry API Server     ║
║  ✅ Server running on port ${PORT}       ║
║  🌐 http://localhost:${PORT}              ║
╚════════════════════════════════════════╝
  `);
});

export default app;
