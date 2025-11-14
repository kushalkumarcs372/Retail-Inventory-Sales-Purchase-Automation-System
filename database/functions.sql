USE metro_cashcarry_db;

-- ==========================================================
-- Utility Functions (VS Code Compatible)
-- ==========================================================

DROP FUNCTION IF EXISTS fn_sale_total;
DELIMITER //
CREATE FUNCTION fn_sale_total(p_sale_id INT) 
RETURNS DECIMAL(12,2)
DETERMINISTIC
SQL SECURITY INVOKER
RETURNS NULL ON NULL INPUT
BEGIN
    DECLARE v_total DECIMAL(12,2);
    SELECT IFNULL(SUM(quantity * unit_price), 0.00)
    INTO v_total 
    FROM Sales_Product 
    WHERE sale_id = p_sale_id;
    RETURN v_total;
END//
DELIMITER ;

-- ==========================================================

DROP FUNCTION IF EXISTS fn_customer_total_spent;
DELIMITER //
CREATE FUNCTION fn_customer_total_spent(p_customer_id INT)
RETURNS DECIMAL(12,2)
DETERMINISTIC
SQL SECURITY INVOKER
RETURNS NULL ON NULL INPUT
BEGIN
    DECLARE v_total DECIMAL(12,2);
    SELECT IFNULL(SUM(amount_paid), 0.00)
    INTO v_total 
    FROM Sales 
    WHERE customer_id = p_customer_id;
    RETURN v_total;
END//
DELIMITER ;
