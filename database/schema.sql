-- =========================================================
-- metro_cashcarry_db : Full Clean Schema (auth split ready)
-- =========================================================

-- Safety: start fresh
DROP DATABASE IF EXISTS metro_cashcarry_db;
CREATE DATABASE metro_cashcarry_db;
USE metro_cashcarry_db;

-- ---------------------------
-- CUSTOMER (auth: password NOT NULL)
-- ---------------------------
CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name  VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name   VARCHAR(50) NOT NULL,
    phone       VARCHAR(15) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone)
) ENGINE=InnoDB;



-- ---------------------------
-- EMPLOYEE (auth split, salary, recursive supervisor)
-- ---------------------------
CREATE TABLE Employee (
    employee_id   INT PRIMARY KEY AUTO_INCREMENT,
    first_name    VARCHAR(50) NOT NULL,
    last_name     VARCHAR(50) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    role          ENUM('Cashier', 'Manager', 'Admin') DEFAULT 'Cashier',
    phone_number  VARCHAR(15),
    salary        DECIMAL(10,2) DEFAULT 0.00,
    supervisor_id INT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    CONSTRAINT fk_employee_supervisor
        FOREIGN KEY (supervisor_id) REFERENCES Employee(employee_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------
-- MEMBERSHIP (1:1-ish with Customer)
-- ---------------------------
CREATE TABLE Membership (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id   INT NOT NULL,
    type          VARCHAR(50),
    start_date    DATE,
    end_date      DATE,
    CONSTRAINT fk_membership_customer
        FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------
-- SUPPLIER (+ multivalued emails)
-- ---------------------------
CREATE TABLE Supplier (
    supplier_id    INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name  VARCHAR(100) NOT NULL,
    supplier_phone VARCHAR(20),
    location       VARCHAR(100),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Supplier_Email (
    email_id    INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    email       VARCHAR(255) NOT NULL,
    UNIQUE KEY ux_supplier_email (supplier_id, email),
    CONSTRAINT fk_supplier_email_supplier
        FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------
-- PRODUCT (with image_url, category, description)
-- ---------------------------
CREATE TABLE Product (
    product_id  INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    brand        VARCHAR(100),
    unit_price   DECIMAL(10,2) DEFAULT 0.00,
    stock        INT DEFAULT 0,
    supplier_id  INT,
    image_url    VARCHAR(500),
    description  TEXT,
    category     VARCHAR(100),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_supplier
        FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_category (category),
    INDEX idx_stock (stock)
) ENGINE=InnoDB;

-- ---------------------------
-- PURCHASE ORDER (M:N with Product)
-- ---------------------------
CREATE TABLE Purchase_Order (
    order_id   INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT,
    total      DECIMAL(12,2) DEFAULT 0.00,
    order_date DATE,
    status     VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_supplier
        FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Purchase_Order_Product (
    order_id  INT,
    product_id INT,
    quantity  INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id),
    CONSTRAINT fk_pop_po
        FOREIGN KEY (order_id)  REFERENCES Purchase_Order(order_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pop_product
        FOREIGN KEY (product_id) REFERENCES Product(product_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------
-- SALES (M:N with Product)
-- ---------------------------
CREATE TABLE Sales (
    sale_id     INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    employee_id INT,
    payment_mode VARCHAR(50),
    amount_paid DECIMAL(12,2) DEFAULT 0.00,
    sale_date   DATE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_customer
        FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sales_employee
        FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_sale_date (sale_date),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

CREATE TABLE Sales_Product (
    sale_id    INT,
    product_id INT,
    quantity   INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (sale_id, product_id),
    CONSTRAINT fk_sp_sales
        FOREIGN KEY (sale_id)    REFERENCES Sales(sale_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sp_product
        FOREIGN KEY (product_id) REFERENCES Product(product_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------
-- CART (frontend workflow) + ITEMS
-- ---------------------------
CREATE TABLE Cart (
    cart_id    INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_customer
        FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

CREATE TABLE Cart_Item (
    cart_id    INT,
    product_id INT,
    quantity   INT NOT NULL,
    added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cart_id, product_id),
    CONSTRAINT fk_ci_cart
        FOREIGN KEY (cart_id)    REFERENCES Cart(cart_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk
