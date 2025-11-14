// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";

const router = express.Router();

/* ───────── token middleware ───────── */
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "metro-secret-key-2025");
    req.user = decoded; // { id, type, role, access_level }
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

/* ───────── register: customer ───────── */
router.post("/register/customer", async (req, res) => {
  const { first_name, middle_name, last_name, phone, password } = req.body;
  if (!first_name || !last_name || !phone || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  try {
    const [existing] = await db.promise().query("SELECT 1 FROM Customer WHERE phone=?", [phone]);
    if (existing.length) return res.status(400).json({ success: false, message: "Phone already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO Customer(first_name,middle_name,last_name,phone,password) VALUES(?,?,?,?,?)",
        [first_name, middle_name, last_name, phone, hashed]
      );

    const token = jwt.sign(
      { id: result.insertId, type: "customer", role: "Customer", access_level: "customer" },
      process.env.JWT_SECRET || "metro-secret-key-2025",
      { expiresIn: "30d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: result.insertId,
        customer_id: result.insertId, // IMPORTANT for cart
        type: "customer",
        first_name,
        last_name,
        phone,
        role: "Customer",
        access_level: "customer",
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/* ───────── register: employee (Admin/Manager/Cashier) ───────── */
router.post("/register/employee", async (req, res) => {
  const { first_name, last_name, email, password, role, phone_number } = req.body;
  if (!first_name || !last_name || !email || !password || !phone_number) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  try {
    const [ex] = await db
      .promise()
      .query("SELECT 1 FROM Employee WHERE email=? OR phone_number=?", [email, phone_number]);
    if (ex.length) return res.status(400).json({ success: false, message: "Already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const finalRole = role || "Cashier";

    const [result] = await db
      .promise()
      .query(
        "INSERT INTO Employee(first_name,last_name,email,password,role,phone_number) VALUES(?,?,?,?,?,?)",
        [first_name, last_name, email, hashed, finalRole, phone_number]
      );

    const token = jwt.sign(
      { id: result.insertId, type: "employee", role: finalRole, access_level: finalRole.toLowerCase() },
      process.env.JWT_SECRET || "metro-secret-key-2025",
      { expiresIn: "30d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: result.insertId,
        // NOTE: no customer_id for employees (prevents cart for staff)
        type: "employee",
        first_name,
        last_name,
        email,
        phone_number,
        role: finalRole, // "Admin" | "Manager" | "Cashier"
        access_level: finalRole.toLowerCase(),
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

/* ───────── login (phone for customer, email for employee) ───────── */
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: "Required fields missing" });
  }
  try {
    let user = null;
    let userType = null;

    const [cust] = await db.promise().query("SELECT * FROM Customer WHERE phone=?", [identifier]);
    if (cust.length) {
      user = cust[0];
      userType = "customer";
    } else {
      const [emp] = await db.promise().query("SELECT * FROM Employee WHERE email=?", [identifier]);
      if (emp.length) {
        user = emp[0];
        userType = "employee";
      }
    }

    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const role = userType === "employee" ? user.role : "Customer";
    const access_level = userType === "employee" ? user.role.toLowerCase() : "customer";
    const id = userType === "customer" ? user.customer_id : user.employee_id;

    const token = jwt.sign({ id, type: userType, role, access_level }, process.env.JWT_SECRET || "metro-secret-key-2025", {
      expiresIn: "30d",
    });

    return res.json({
      success: true,
      token,
      user: {
        id,
        ...(userType === "customer" ? { customer_id: id } : {}), // only customers get customer_id
        type: userType,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || user.phone_number || null,
        email: user.email || null,
        role, // "Customer" | "Admin" | "Manager" | "Cashier"
        access_level,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
