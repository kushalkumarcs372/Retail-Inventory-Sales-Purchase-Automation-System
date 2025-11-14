import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Kushalkumar@123",
  database: "metro_cashcarry_db"
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err);
  } else {
    console.log("✅ Connected to MySQL Database");
  }
});

export default db;
