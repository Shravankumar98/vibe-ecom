import React from 'react';
import "../App.css"

export default function Cart({ cart, onRemove, onUpdateQty, onCheckout }) {
  return (
    <aside className="cart">
      <h2>Cart</h2>
      {cart.items.length === 0 ? <p>Cart empty</p> : (
        <>
          <ul>
            {cart.items.map(it => (
              <li key={it.cartId}>
                <div className="ci-row">
                  <div>{it.name}</div>
                  <div>₹{it.price.toFixed(2)}</div>
                  <div>
                    <button onClick={() => onUpdateQty(it.cartId, Math.max(0, it.qty - 1))}>-</button>
                    <span>{it.qty}</span>
                    <button onClick={() => onUpdateQty(it.cartId, it.qty + 1)}>+</button>
                  </div>
                  <div>
                    <button onClick={() => onRemove(it.cartId)}>Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="cart-footer">
            <div>Total: ₹{cart.total.toFixed(2)}</div>
            <button onClick={onCheckout}>Checkout</button>
          </div>
        </>
      )}
    </aside>
  );
}
