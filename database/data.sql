-- data.sql
USE metro_cashcarry_db;

-- ---------------------------
-- Supplier Seed Data
-- ---------------------------
INSERT INTO Supplier (supplier_name, supplier_phone, location) VALUES
('ABC Suppliers','9100011111','Mumbai'),
('FreshMart','9100022222','Delhi'),
('QualityFoods','9100033333','Bangalore'),
('GlobalTrade','9100044444','Chennai'),
('PrimeDistributors','9100055555','Hyderabad'),
('CityGrocers','9100066666','Pune'),
('FarmFresh','9100077777','Kolkata'),
('GoodFoods','9100088888','Ahmedabad'),
('SuperSupply','9100099999','Jaipur'),
('MegaStore','9100000001','Lucknow');

-- Supplier Emails
INSERT INTO Supplier_Email (supplier_id, email) VALUES
(1,'abc@gmail.com'),(1,'support@abc.com'),
(2,'fresh@gmail.com'),
(3,'quality@foods.com'),
(4,'global@trade.com'),
(5,'prime@distributors.com'),
(6,'citygrocers@mail.com'),
(7,'farmfresh@mail.com'),
(8,'goodfoods@mail.com'),
(9,'supersupply@mail.com'),
(10,'megastore@mail.com');

-- ---------------------------
-- Products
-- ---------------------------
INSERT INTO Product (product_name, brand, unit_price, stock, supplier_id, category, description) VALUES
('Basmati Rice','India Gate',60.00,200,1,'Grains','Premium quality aged basmati rice'),
('Whole Wheat Flour','Aashirvaad',45.00,180,2,'Grains','100% whole wheat atta'),
('Toned Milk','Amul',35.00,300,3,'Dairy','Fresh toned milk 1L'),
('Bathing Soap','Dettol',25.00,150,4,'Personal Care','Antibacterial bathing soap'),
('Anti-Dandruff Shampoo','Clinic Plus',80.00,250,5,'Personal Care','Strong & long shampoo'),
('Cooking Oil','Fortune',120.00,400,6,'Cooking','Refined sunflower oil'),
('White Sugar','Dhampur',40.00,350,7,'Sweeteners','Pure white refined sugar'),
('Premium Tea','Taj Mahal',150.00,200,8,'Beverages','Premium CTC tea leaves'),
('Glucose Biscuits','Parle-G',20.00,300,9,'Snacks','Original glucose biscuits'),
('Mango Juice','Real',90.00,180,10,'Beverages','100% natural mango juice'),
('Brown Bread','Britannia',45.00,120,2,'Bakery','Whole wheat brown bread'),
('Paneer','Amul',180.00,80,3,'Dairy','Fresh cottage cheese 200g'),
('Hand Wash','Dettol',65.00,200,4,'Personal Care','Liquid hand wash'),
('Hair Oil','Parachute',95.00,150,5,'Personal Care','100% pure coconut oil'),
('Masala','MDH',50.00,250,6,'Spices','Garam masala powder'),
('Coffee Powder','Nescafe',220.00,100,8,'Beverages','Classic instant coffee'),
('Corn Flakes','Kelloggs',210.00,90,9,'Breakfast','Crunchy corn flakes'),
('Tomato Ketchup','Maggi',85.00,180,10,'Sauces','Rich tomato ketchup'),
('Curd','Mother Dairy',45.00,150,3,'Dairy','Fresh curd 400g'),
('Instant Noodles','Maggi',12.00,400,10,'Instant Food','Masala instant noodles');

-- ---------------------------
-- Customers
-- ---------------------------
INSERT INTO Customer (first_name, middle_name, last_name, phone, password) VALUES
('Aarav','M','Kumar','9123456780','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye'),
('Vihaan','M','Kumar','9123456781','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye'),
('Reyansh','M','Sharma','9123456782','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye'),
('Aditya','K','Singh','9123456783','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye'),
('Krishna','M','Patel','9123456784','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye'),
('Anaya','R','Gupta','9123456785','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye'),
('Sara','M','Reddy','9123456786','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye'),
('Ishaan','K','Rao','9123456787','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye'),
('Diya','M','Joshi','9123456788','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye'),
('Arjun','M','Desai','9123456789','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye');

-- Memberships
INSERT INTO Membership (customer_id, type, start_date, end_date) VALUES
(1,'Gold','2024-01-01','2025-01-01'),
(2,'Silver','2024-02-01','2025-02-01'),
(3,'Gold','2024-03-01','2025-03-01'),
(4,'Platinum','2024-04-01','2025-04-01'),
(5,'Silver','2024-05-01','2025-05-01'),
(6,'Gold','2024-06-01','2025-06-01'),
(7,'Silver','2024-07-01','2025-07-01'),
(8,'Gold','2024-08-01','2025-08-01'),
(9,'Platinum','2024-09-01','2025-09-01'),
(10,'Gold','2024-10-01','2025-10-01');

-- ---------------------------
-- Employees (roles normalized to 3-role schema)
-- password reused same bcrypt hash
-- email auto generated
-- ---------------------------
INSERT INTO Employee (first_name, last_name, email, password, role, phone_number, salary, supervisor_id) VALUES
('Anita','Rao','anita.rao@metro.com','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye','Manager','9900112233',80000,NULL),
('Ravi','Kumar','ravi.kumar@metro.com','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye','Cashier','9988776655',40000,1),
('Sneha','Patel','sneha.patel@metro.com','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye','Cashier','9877665544',35000,1),
('Deepak','Sharma','deepak.sharma@metro.com','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye','Cashier','9811223344',30000,1),
('Asha','Nair','asha.nair@metro.com','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye','Cashier','9822334455',35000,1),
('Kishore','R','kishore.r@metro.com','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye','Cashier','9877123456',25000,4),
('Rekha','Singh','rekha.singh@metro.com','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye','Manager','9844556677',45000,1),
('Nikhil','Jain','nikhil.jain@metro.com','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye','Cashier','9811556677',33000,1),
('Ramesh','Kumar','ramesh.kumar@metro.com','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye','Cashier','9900778899',28000,1),
('Priya','Menon','priya.menon@metro.com','$2b$10$rk6gZDOLlGvjlLOBnOHWqOYlJjB.HuZDZBRMxLxC1tWpQsNl9Jxye','Manager','9822113344',60000,1);

-- ---------------------------
-- Purchase Orders + Purchase Items
-- ---------------------------
INSERT INTO Purchase_Order (supplier_id, total, order_date, status) VALUES
(1,20000,'2024-02-01','Completed'),
(2,18000,'2024-02-03','Completed'),
(3,25000,'2024-02-04','Completed'),
(4,22000,'2024-02-05','Completed'),
(5,17000,'2024-02-06','Completed'),
(6,15000,'2024-02-07','Completed'),
(7,30000,'2024-02-08','Completed'),
(8,27000,'2024-02-09','Completed'),
(9,26000,'2024-02-10','Completed'),
(10,28000,'2024-02-11','Completed');

INSERT INTO Purchase_Order_Product (order_id, product_id, quantity, unit_cost) VALUES
(1,1,100,55.00),(2,2,120,40.00),(3,3,90,30.00),(4,4,110,20.00),(5,5,80,70.00),
(6,6,150,110.00),(7,7,100,35.00),(8,8,200,140.00),(9,9,130,18.00),(10,10,140,85.00);

-- ---------------------------
-- Sales + Sales_Product
-- ---------------------------
INSERT INTO Sales (customer_id, employee_id, payment_mode, amount_paid, sale_date) VALUES
(1,2,'Cash',435.00,'2024-10-25'),
(2,3,'Card',140.00,'2024-10-26'),
(3,4,'UPI',50.00,'2024-10-27'),
(4,5,'Cash',80.00,'2024-10-28'),
(5,2,'Card',360.00,'2024-10-29'),
(6,3,'UPI',200.00,'2024-10-29'),
(7,5,'Cash',600.00,'2024-10-30'),
(8,4,'Card',40.00,'2024-10-30'),
(9,2,'UPI',540.00,'2024-10-30'),
(10,3,'Cash',85.00,'2024-10-30');

INSERT INTO Sales_Product (sale_id, product_id, quantity, unit_price) VALUES
(1,1,5,60.00),(1,2,3,45.00),
(2,3,4,35.00),
(3,4,2,25.00),
(4,5,1,80.00),
(5,6,3,120.00),
(6,7,5,40.00),
(7,8,4,150.00),
(8,9,2,20.00),
(9,10,6,90.00);

-- ---------------------------
-- Bills
-- ---------------------------
INSERT INTO Bill (sale_id, bill_date, total_amount) VALUES
(1,'2024-10-25',435.00),
(2,'2024-10-26',140.00),
(3,'2024-10-27',50.00),
(4,'2024-10-28',80.00),
(5,'2024-10-29',360.00);

INSERT INTO Bill_Item (bill_id, product_id, quantity, unit_price)
SELECT b.bill_id, sp.product_id, sp.quantity, sp.unit_price
FROM Bill b
JOIN Sales_Product sp ON b.sale_id = sp.sale_id
WHERE b.bill_id IN (1,2,3,4,5);

-- ---------------------------
-- Sample Cart
-- ---------------------------
INSERT INTO Cart (customer_id) VALUES (1);

INSERT INTO Cart_Item (cart_id, product_id, quantity) VALUES
(1,1,2),
(1,3,1);

COMMIT;

SELECT '✅ Data Insert Completed Successfully!' AS Status;
