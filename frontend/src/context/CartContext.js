import React, { createContext, useContext, useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, count: 0, cart_id: null });
  const [loading, setLoading] = useState(false);

  // Load cart for customers only
  useEffect(() => {
    if (user?.role === "Customer" && user?.customer_id) {
      fetchCart(user.customer_id);
    } else {
      // Staff or no user → no cart
      setCart({ items: [], total: 0, count: 0, cart_id: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const fetchCart = async (customer_id) => {
    if (!customer_id) return;
    try {
      setLoading(true);
      const { data } = await API.get(`/cart/${customer_id}`); // matches GET /cart/:customer_id
      if (data?.success) {
        setCart({
          cart_id: data.cart_id,
          items: data.items || [],
          total: parseFloat(data.total || 0),
          count: data.count || 0,
        });
      } else {
        setCart({ items: [], total: 0, count: 0, cart_id: null });
      }
    } catch (e) {
      // 404 means new cart will be created later on first add
      setCart({ items: [], total: 0, count: 0, cart_id: null });
    } finally {
      setLoading(false);
    }
  };

  const requireCustomer = () => {
    if (user?.role !== "Customer" || !user?.customer_id) {
      alert("Only customers can use the cart. Please login as a customer.");
      return false;
    }
    return true;
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!requireCustomer()) return false;
    try {
      const { data } = await API.post("/cart/add", {
        customer_id: user.customer_id,
        product_id: productId,
        quantity,
      });
      if (data?.success) {
        await fetchCart(user.customer_id);
        return true;
      }
      alert(data?.message || "Failed to add item to cart");
      return false;
    } catch (e) {
      alert(e.response?.data?.message || "Failed to add item to cart");
      return false;
    }
  };

  const updateCartItem = async (cartId, productId, quantity) => {
    if (!requireCustomer() || quantity < 1) return false;
    try {
      const { data } = await API.put("/cart/update", { cart_id: cartId, product_id: productId, quantity });
      if (data?.success) {
        await fetchCart(user.customer_id);
        return true;
      }
      alert(data?.message || "Failed to update quantity");
      return false;
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update quantity");
      return false;
    }
  };

  const removeFromCart = async (cartId, productId) => {
    if (!requireCustomer()) return false;
    try {
      const { data } = await API.delete("/cart/remove", { data: { cart_id: cartId, product_id: productId } });
      if (data?.success) {
        await fetchCart(user.customer_id);
        return true;
      }
      alert(data?.message || "Failed to remove item");
      return false;
    } catch (e) {
      alert(e.response?.data?.message || "Failed to remove item");
      return false;
    }
  };

  const clearCart = async (cartId) => {
    if (!requireCustomer()) return false;
    try {
      const { data } = await API.delete(`/cart/clear/${cartId}`);
      if (data?.success) {
        await fetchCart(user.customer_id);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const getCartTotal = () => cart.total || 0;
  const getCartCount = () => cart.count || 0;
  const getCartItemCount = () => cart.count || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        fetchCart,
        getCartTotal,
        getCartCount,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
