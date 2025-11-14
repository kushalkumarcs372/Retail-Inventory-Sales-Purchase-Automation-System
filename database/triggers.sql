USE metro_cashcarry_db;

-- ==========================================================
-- Triggers (Aligned with final schema and procedures)
-- Notes:
-- - Our proc_finalize_cart already decrements Product.stock atomically.
--   To avoid double-decrement/false failures, sales triggers are VALIDATION-ONLY.
-- - Emojis removed for portability.
-- - Includes robust validation on insert/update paths.
-- ==========================================================
DELIMITER //

-- ==========================================================
-- 1) SALES VALIDATION (no stock mutation here)
-- ==========================================================

DROP TRIGGER IF EXISTS trg_sales_product_before_insert;
CREATE TRIGGER trg_sales_product_before_insert
BEFORE INSERT ON Sales_Product
FOR EACH ROW
BEGIN
    -- quantity must be positive
    IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sales_Product.quantity must be > 0';
    END IF;

    -- product must exist
    IF NOT EXISTS (SELECT 1 FROM Product WHERE product_id = NEW.product_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product does not exist';
    END IF;
END;
//

-- Optional: also validate on UPDATE of Sales_Product (if you ever allow edits)
DROP TRIGGER IF EXISTS trg_sales_product_before_update;
CREATE TRIGGER trg_sales_product_before_update
BEFORE UPDATE ON Sales_Product
FOR EACH ROW
BEGIN
    IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sales_Product.quantity must be > 0';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Product WHERE product_id = NEW.product_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product does not exist';
    END IF;

    -- IMPORTANT: We do not mutate stock here. Stock adjustments are handled in procedures.
END;
//


-- ==========================================================
-- 2) PURCHASE SIDE: increase stock when items are received
-- ==========================================================

DROP TRIGGER IF EXISTS trg_purchase_product_after_insert;
CREATE TRIGGER trg_purchase_product_after_insert
AFTER INSERT ON Purchase_Order_Product
FOR EACH ROW
BEGIN
    -- quantity must be positive
    IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Purchase_Order_Product.quantity must be > 0';
    END IF;

    UPDATE Product
    SET stock = stock + NEW.quantity
    WHERE product_id = NEW.product_id;
END;
//

-- Optional: handle UPDATE to Purchase_Order_Product (delta adjust)
DROP TRIGGER IF EXISTS trg_purchase_product_before_update;
CREATE TRIGGER trg_purchase_product_before_update
BEFORE UPDATE ON Purchase_Order_Product
FOR EACH ROW
BEGIN
    IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Purchase_Order_Product.quantity must be > 0';
    END IF;

    -- Adjust Product stock by the delta if product_id unchanged
    IF NEW.product_id = OLD.product_id THEN
        UPDATE Product
        SET stock = stock + (NEW.quantity - OLD.quantity)
        WHERE product_id = NEW.product_id;
    ELSE
        -- If product changed, revert old and apply new
        UPDATE Product
        SET stock = stock - OLD.quantity
        WHERE product_id = OLD.product_id;

        UPDATE Product
        SET stock = stock + NEW.quantity
        WHERE product_id = NEW.product_id;
    END IF;
END;
//

-- Optional: handle DELETE of Purchase_Order_Product (revert stock)
DROP TRIGGER IF EXISTS trg_purchase_product_after_delete;
CREATE TRIGGER trg_purchase_product_after_delete
AFTER DELETE ON Purchase_Order_Product
FOR EACH ROW
BEGIN
    UPDATE Product
    SET stock = stock - OLD.quantity
    WHERE product_id = OLD.product_id;
END;
//


-- ==========================================================
-- 3) DATA INTEGRITY VALIDATION
-- ==========================================================

-- Employee salary >= 0 (insert)
DROP TRIGGER IF EXISTS trg_employee_salary_check_ins;
CREATE TRIGGER trg_employee_salary_check_ins
BEFORE INSERT ON Employee
FOR EACH ROW
BEGIN
    IF NEW.salary IS NULL OR NEW.salary < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Employee salary cannot be negative';
    END IF;
END;
//

-- Employee salary >= 0 (update)
DROP TRIGGER IF EXISTS trg_employee_salary_check_upd;
CREATE TRIGGER trg_employee_salary_check_upd
BEFORE UPDATE ON Employee
FOR EACH ROW
BEGIN
    IF NEW.salary IS NULL OR NEW.salary < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Employee salary cannot be negative';
    END IF;
END;
//

-- Membership date validity (insert)
DROP TRIGGER IF EXISTS trg_membership_valid_dates_ins;
CREATE TRIGGER trg_membership_valid_dates_ins
BEFORE INSERT ON Membership
FOR EACH ROW
BEGIN
    IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL AND NEW.end_date < NEW.start_date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Membership end_date cannot be before start_date';
    END IF;
END;
//

-- Membership date validity (update)
DROP TRIGGER IF EXISTS trg_membership_valid_dates_upd;
CREATE TRIGGER trg_membership_valid_dates_upd
BEFORE UPDATE ON Membership
FOR EACH ROW
BEGIN
    IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL AND NEW.end_date < NEW.start_date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Membership end_date cannot be before start_date';
    END IF;
END;
//

-- Product stock non-negative on update (defensive)
DROP TRIGGER IF EXISTS trg_product_stock_check_upd;
CREATE TRIGGER trg_product_stock_check_upd
BEFORE UPDATE ON Product
FOR EACH ROW
BEGIN
    IF NEW.stock < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product stock cannot be negative';
    END IF;
END;
//

-- Purchase order total non-negative
DROP TRIGGER IF EXISTS trg_purchase_order_total_check_ins;
CREATE TRIGGER trg_purchase_order_total_check_ins
BEFORE INSERT ON Purchase_Order
FOR EACH ROW
BEGIN
    IF NEW.total IS NULL OR NEW.total < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Purchase order total cannot be negative';
    END IF;
END;
//

-- Sales amount non-negative
DROP TRIGGER IF EXISTS trg_sales_amount_check_ins;
CREATE TRIGGER trg_sales_amount_check_ins
BEFORE INSERT ON Sales
FOR EACH ROW
BEGIN
    IF NEW.amount_paid IS NULL OR NEW.amount_paid < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sales amount cannot be negative';
    END IF;
END;
//

DELIMITER ;


USE metro_cashcarry_db;
DELIMITER //

-- When new inventory for product inserted → sync Product.stock (sum of all warehouses)
DROP TRIGGER IF EXISTS trg_inventory_after_insert;
CREATE TRIGGER trg_inventory_after_insert
AFTER INSERT ON Inventory
FOR EACH ROW
BEGIN
    UPDATE Product p
    SET p.stock = (
        SELECT IFNULL(SUM(stock),0)
        FROM Inventory
        WHERE product_id = NEW.product_id
    )
    WHERE p.product_id = NEW.product_id;
END;
//

-- When inventory quantity edited
DROP TRIGGER IF EXISTS trg_inventory_after_update;
CREATE TRIGGER trg_inventory_after_update
AFTER UPDATE ON Inventory
FOR EACH ROW
BEGIN
    UPDATE Product p
    SET p.stock = (
        SELECT IFNULL(SUM(stock),0)
        FROM Inventory
        WHERE product_id = NEW.product_id
    )
    WHERE p.product_id = NEW.product_id;
END;
//

-- When inventory row deleted
DROP TRIGGER IF EXISTS trg_inventory_after_delete;
CREATE TRIGGER trg_inventory_after_delete
AFTER DELETE ON Inventory
FOR EACH ROW
BEGIN
    UPDATE Product p
    SET p.stock = (
        SELECT IFNULL(SUM(stock),0)
        FROM Inventory
        WHERE product_id = OLD.product_id
    )
    WHERE p.product_id = OLD.product_id;
END;
//

DELIMITER ;
