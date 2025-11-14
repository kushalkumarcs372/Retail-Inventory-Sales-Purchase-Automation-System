USE metro_cashcarry_db;

-- ==========================================================
-- Core Business Procedures (VS Code / MySQL CLI Compatible)
-- Policy: A = hard fail if any product is short on stock
-- ==========================================================
DELIMITER //

-- ----------------------------------------------------------
-- proc_add_to_cart
-- Creates a cart for the customer if missing, then adds/bumps item qty
-- Validates positive qty and product existence
-- ----------------------------------------------------------
DROP PROCEDURE IF EXISTS proc_add_to_cart;
CREATE PROCEDURE proc_add_to_cart(
    IN p_customer_id INT,
    IN p_product_id  INT,
    IN p_quantity    INT
)
BEGIN
    DECLARE v_cart_id INT;

    -- basic validations
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be a positive integer';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Customer WHERE customer_id = p_customer_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer not found';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Product WHERE product_id = p_product_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product not found';
    END IF;

    -- find or create cart
    SELECT cart_id INTO v_cart_id
    FROM Cart
    WHERE customer_id = p_customer_id
    LIMIT 1;

    IF v_cart_id IS NULL THEN
        INSERT INTO Cart (customer_id) VALUES (p_customer_id);
        SET v_cart_id = LAST_INSERT_ID();
    END IF;

    -- insert or bump quantity
    INSERT INTO Cart_Item (cart_id, product_id, quantity)
    VALUES (v_cart_id, p_product_id, p_quantity)
    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity);
END;
//


-- ----------------------------------------------------------
-- proc_finalize_cart
-- Finalizes a cart into a Sale + Bill with strict stock checking.
-- Steps:
-- 1) Validate cart, employee, and that cart has items
-- 2) Create Sales row (amount_paid=0)
-- 3) For each item: lock/decrement stock atomically, insert Sales_Product
-- 4) Compute amount_paid via fn_sale_total, create Bill + Bill_Items
-- 5) Clear cart
-- All-or-nothing with ROLLBACK on any failure.
-- ----------------------------------------------------------

DROP PROCEDURE IF EXISTS proc_finalize_cart;
CREATE PROCEDURE proc_finalize_cart(
    IN p_cart_id      INT,
    IN p_employee_id  INT,
    IN p_payment_mode VARCHAR(50)
)

BEGIN
    DECLARE v_customer_id INT;
    DECLARE v_sale_id     INT;
    DECLARE v_prod_id     INT;
    DECLARE v_qty         INT;
    DECLARE v_unit_price  DECIMAL(10,2);
    DECLARE v_done        TINYINT DEFAULT 0;
    DECLARE v_bill_id     INT;

    -- cursor to read items + current unit_price
    DECLARE cur_items CURSOR FOR
        SELECT ci.product_id, ci.quantity, p.unit_price
        FROM Cart_Item ci
        JOIN Product p ON p.product_id = ci.product_id
        WHERE ci.cart_id = p_cart_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    -- robust error handler: rollback and throw a generic error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Transaction failed in proc_finalize_cart';
    END;

    START TRANSACTION;

    -- validate cart
    SELECT customer_id INTO v_customer_id
    FROM Cart
    WHERE cart_id = p_cart_id
    FOR UPDATE;  -- lock the cart row

    IF v_customer_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid cart';
    END IF;

    -- validate employee
    IF NOT EXISTS (SELECT 1 FROM Employee WHERE employee_id = p_employee_id) THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Employee not found';
    END IF;

    -- validate cart has items
    IF (SELECT COUNT(*) FROM Cart_Item WHERE cart_id = p_cart_id) = 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cart is empty';
    END IF;

    -- create sale skeleton
    INSERT INTO Sales (customer_id, employee_id, payment_mode, amount_paid, sale_date)
    VALUES (v_customer_id, p_employee_id, p_payment_mode, 0.00, CURDATE());
    SET v_sale_id = LAST_INSERT_ID();

    -- iterate items: decrement stock atomically and create Sales_Product
    OPEN cur_items;
    read_loop: LOOP
        FETCH cur_items INTO v_prod_id, v_qty, v_unit_price;
        IF v_done = 1 THEN LEAVE read_loop; END IF;

        -- strict stock check A:
        -- atomically decrement only if enough stock; if not, rollback & error
        UPDATE Product
        SET stock = stock - v_qty
        WHERE product_id = v_prod_id
          AND stock >= v_qty;

        IF ROW_COUNT() = 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Insufficient stock for one or more products';
        END IF;

        INSERT INTO Sales_Product (sale_id, product_id, quantity, unit_price)
        VALUES (v_sale_id, v_prod_id, v_qty, v_unit_price);
    END LOOP;
    CLOSE cur_items;

    -- finalize amounts and bill
    UPDATE Sales
    SET amount_paid = fn_sale_total(v_sale_id)
    WHERE sale_id = v_sale_id;

    INSERT INTO Bill (sale_id, bill_date, total_amount)
    VALUES (v_sale_id, CURDATE(), fn_sale_total(v_sale_id));
    SET v_bill_id = LAST_INSERT_ID();

    INSERT INTO Bill_Item (bill_id, product_id, quantity, unit_price)
    SELECT v_bill_id, sp.product_id, sp.quantity, sp.unit_price
    FROM Sales_Product sp
    WHERE sp.sale_id = v_sale_id;

    -- cleanup cart
    DELETE FROM Cart_Item WHERE cart_id = p_cart_id;
    DELETE FROM Cart WHERE cart_id = p_cart_id;

    COMMIT;
END;
//

DELIMITER ;

DROP PROCEDURE IF EXISTS proc_rebuild_global_stock;
CREATE PROCEDURE proc_rebuild_global_stock()
BEGIN
    UPDATE Product p
    JOIN (
        SELECT product_id, IFNULL(SUM(stock),0) AS total_stock
        FROM Inventory
        GROUP BY product_id
    ) inv ON inv.product_id = p.product_id
    SET p.stock = inv.total_stock;
END //
