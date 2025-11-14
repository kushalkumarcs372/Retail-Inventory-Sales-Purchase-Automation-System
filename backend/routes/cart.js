import express from "express";
import db from "../db/connection.js";

const router = express.Router();

/**
 * ✅ GET or CREATE cart for customer
 */
router.get("/:customer_id", (req, res) => {
  const { customer_id } = req.params;
  
  console.log(`🛒 Fetching cart for customer: ${customer_id}`);
  
  // First, check if cart exists
  const checkCartQuery = "SELECT cart_id FROM Cart WHERE customer_id = ?";
  
  db.query(checkCartQuery, [customer_id], (err, cartResult) => {
    if (err) {
      console.error("❌ Error checking cart:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch cart" 
      });
    }
    
    let cart_id;
    
    // If no cart exists, create one
    if (cartResult.length === 0) {
      console.log(`📝 Creating new cart for customer ${customer_id}`);
      const createCartQuery = "INSERT INTO Cart (customer_id) VALUES (?)";
      db.query(createCartQuery, [customer_id], (err2, createResult) => {
        if (err2) {
          console.error("❌ Error creating cart:", err2);
          return res.status(500).json({ 
            success: false, 
            message: "Failed to create cart" 
          });
        }
        cart_id = createResult.insertId;
        console.log(`✅ New cart created with ID: ${cart_id}`);
        fetchCartItems(cart_id, res);
      });
    } else {
      cart_id = cartResult[0].cart_id;
      console.log(`✅ Found existing cart ID: ${cart_id}`);
      fetchCartItems(cart_id, res);
    }
  });
});

/**
 * Helper function to fetch cart items
 */
function fetchCartItems(cart_id, res) {
  const query = `
    SELECT 
      ci.product_id,
      p.product_name,
      p.brand,
      ci.quantity,
      p.unit_price,
      (ci.quantity * p.unit_price) AS total_price,
      p.stock
    FROM Cart_Item ci 
    JOIN Product p ON ci.product_id = p.product_id
    WHERE ci.cart_id = ?
  `;
  
  db.query(query, [cart_id], (err, items) => {
    if (err) {
      console.error("❌ Error fetching cart items:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch cart items" 
      });
    }
    
    const total = items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    
    console.log(`✅ Cart loaded: ${items.length} items, total: ₹${total.toFixed(2)}`);
    
    res.json({ 
      success: true,
      cart_id,
      items,
      total: total.toFixed(2),
      count: items.length
    });
  });
}

/**
 * ✅ POST add item to cart
 */
router.post("/add", (req, res) => {
  const { customer_id, product_id, quantity } = req.body;
  
  console.log(`➕ Adding to cart:`, { customer_id, product_id, quantity });
  
  if (!customer_id || !product_id || !quantity) {
    return res.status(400).json({ 
      success: false, 
      message: "Customer ID, Product ID, and Quantity are required" 
    });
  }
  
  // Check if product has enough stock
  db.query("SELECT stock, product_name FROM Product WHERE product_id = ?", [product_id], (err, stockResult) => {
    if (err || stockResult.length === 0) {
      console.error("❌ Product not found:", product_id);
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    const availableStock = stockResult[0].stock;
    const productName = stockResult[0].product_name;
    
    console.log(`📦 Product: ${productName}, Available stock: ${availableStock}`);
    
    if (quantity > availableStock) {
      console.log(`⚠️ Insufficient stock for ${productName}`);
      return res.status(400).json({ 
        success: false, 
        message: `Only ${availableStock} items available in stock for ${productName}` 
      });
    }
    
    // Use stored procedure to add to cart
    db.query(
      "CALL proc_add_to_cart(?, ?, ?)", 
      [customer_id, product_id, quantity], 
      (err2) => {
        if (err2) {
          console.error("❌ Error adding to cart:", err2);
          return res.status(500).json({ 
            success: false, 
            message: "Failed to add item to cart",
            error: err2.message 
          });
        }
        
        console.log(`✅ Item added to cart successfully: ${productName} x${quantity}`);
        
        res.json({ 
          success: true,
          message: `✅ ${productName} added to cart successfully` 
        });
      }
    );
  });
});

/**
 * ✅ PUT update cart item quantity
 */
router.put("/update", (req, res) => {
  const { cart_id, product_id, quantity } = req.body;
  
  console.log(`📝 Updating cart:`, { cart_id, product_id, quantity });
  
  if (!cart_id || !product_id || quantity === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: "Cart ID, Product ID, and Quantity are required" 
    });
  }
  
  // Check stock availability
  db.query("SELECT stock, product_name FROM Product WHERE product_id = ?", [product_id], (err, stockResult) => {
    if (err || stockResult.length === 0) {
      console.error("❌ Product not found:", product_id);
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    const availableStock = stockResult[0].stock;
    const productName = stockResult[0].product_name;
    
    if (quantity > availableStock) {
      console.log(`⚠️ Insufficient stock: requested ${quantity}, available ${availableStock}`);
      return res.status(400).json({ 
        success: false, 
        message: `Only ${availableStock} items available for ${productName}` 
      });
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      console.log(`🗑️ Removing item (quantity <= 0)`);
      db.query(
        "DELETE FROM Cart_Item WHERE cart_id = ? AND product_id = ?", 
        [cart_id, product_id], 
        (err2) => {
          if (err2) {
            console.error("❌ Error removing item:", err2);
            return res.status(500).json({ 
              success: false, 
              message: "Failed to remove item" 
            });
          }
          console.log(`✅ Item removed from cart`);
          res.json({ 
            success: true,
            message: "✅ Item removed from cart" 
          });
        }
      );
    } else {
      // Update quantity
      db.query(
        "UPDATE Cart_Item SET quantity = ? WHERE cart_id = ? AND product_id = ?", 
        [quantity, cart_id, product_id], 
        (err2) => {
          if (err2) {
            console.error("❌ Error updating cart:", err2);
            return res.status(500).json({ 
              success: false, 
              message: "Failed to update cart" 
            });
          }
          console.log(`✅ Cart quantity updated: ${productName} x${quantity}`);
          res.json({ 
            success: true,
            message: "✅ Cart updated successfully" 
          });
        }
      );
    }
  });
});

/**
 * ✅ DELETE remove item from cart
 */
router.delete("/remove", (req, res) => {
  const { cart_id, product_id } = req.body;
  
  console.log(`🗑️ Removing from cart:`, { cart_id, product_id });
  
  if (!cart_id || !product_id) {
    return res.status(400).json({ 
      success: false, 
      message: "Cart ID and Product ID are required" 
    });
  }
  
  db.query(
    "DELETE FROM Cart_Item WHERE cart_id = ? AND product_id = ?", 
    [cart_id, product_id], 
    (err, result) => {
      if (err) {
        console.error("❌ Error removing item:", err);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to remove item" 
        });
      }
      
      if (result.affectedRows === 0) {
        console.log(`⚠️ Item not found in cart`);
        return res.status(404).json({ 
          success: false, 
          message: "Item not found in cart" 
        });
      }
      
      console.log(`✅ Item removed successfully`);
      
      res.json({ 
        success: true,
        message: "✅ Item removed successfully" 
      });
    }
  );
});

/**
 * ✅ POST checkout cart
 */
router.post("/checkout", (req, res) => {
  const { cart_id, employee_id, payment_mode } = req.body;
  
  console.log(`💳 Processing checkout:`, { cart_id, employee_id, payment_mode });
  
  if (!cart_id || !payment_mode) {
    return res.status(400).json({ 
      success: false, 
      message: "Cart ID and Payment Mode are required" 
    });
  }
  
  // Use stored procedure to finalize cart
  db.query(
    "CALL proc_finalize_cart(?, ?, ?)", 
    [cart_id, employee_id || 1, payment_mode], 
    (err, results) => {
      if (err) {
        console.error("❌ Error during checkout:", err);
        return res.status(500).json({ 
          success: false, 
          message: "Checkout failed",
          error: err.message 
        });
      }
      
      console.log(`✅ Checkout completed successfully`);
      
      res.json({ 
        success: true,
        message: "✅ Checkout completed successfully",
        sale_id: results[0]?.sale_id
      });
    }
  );
});

/**
 * ✅ DELETE clear entire cart
 */
router.delete("/clear/:cart_id", (req, res) => {
  const { cart_id } = req.params;
  
  console.log(`🗑️ Clearing cart: ${cart_id}`);
  
  db.query("DELETE FROM Cart_Item WHERE cart_id = ?", [cart_id], (err) => {
    if (err) {
      console.error("❌ Error clearing cart:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to clear cart" 
      });
    }
    
    console.log(`✅ Cart cleared successfully`);
    
    res.json({ 
      success: true,
      message: "✅ Cart cleared successfully" 
    });
  });
});

export default router;