USE metro_cashcarry_db;

-- ==========================================================
-- views.sql (Aligned with final schema)
-- ==========================================================

-- View: current product stock and supplier
CREATE OR REPLACE VIEW vw_product_stock AS
SELECT 
    p.product_id,
    p.product_name,
    p.brand,
    p.unit_price,
    p.stock,
    s.supplier_name
FROM Product p
LEFT JOIN Supplier s ON p.supplier_id = s.supplier_id;

-- View: recent sales summary (sale + total)
CREATE OR REPLACE VIEW vw_sales_summary AS
SELECT 
    s.sale_id,
    s.sale_date,
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    e.employee_id,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    s.amount_paid
FROM Sales s
LEFT JOIN Customer c ON s.customer_id = c.customer_id
LEFT JOIN Employee e ON s.employee_id = e.employee_id
ORDER BY s.sale_date DESC;

-- View: cart contents for UI (front-end API)
CREATE OR REPLACE VIEW vw_cart_contents AS
SELECT
    ct.cart_id,
    ct.customer_id,
    ci.product_id,
    p.product_name,
    ci.quantity,
    p.unit_price,
    (ci.quantity * p.unit_price) AS line_total
FROM Cart ct
JOIN Cart_Item ci ON ct.cart_id = ci.cart_id
JOIN Product p ON ci.product_id = p.product_id;

CREATE OR REPLACE VIEW vw_global_stock AS
SELECT 
    p.product_id,
    p.product_name,
    IFNULL(SUM(i.stock),0) AS total_stock
FROM Product p
LEFT JOIN Inventory i ON p.product_id = i.product_id
GROUP BY p.product_id, p.product_name;
