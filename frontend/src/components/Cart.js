import React from "react";
import { useCart } from "../context/CartContext";

function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();

  const total = cart.reduce(
    (sum, item) => sum + item.quantity * item.quantity,
    0
  );

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">🧺 Your Cart</h2>
      {cart.length === 0 ? (
        <p className="text-center">Cart is empty.</p>
      ) : (
        <>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.product_id}>
                  <td>{item.product_name}</td>
                  <td>{item.brand}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.quantity * item.quantity}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeFromCart(item.product_id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>Total: ₹{total}</h4>
          <button className="btn btn-success me-2">Checkout</button>
          <button className="btn btn-secondary" onClick={clearCart}>
            Clear Cart
          </button>
        </>
      )}
    </div>
  );
}

export default Cart;
