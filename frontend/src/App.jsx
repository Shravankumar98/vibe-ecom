import React, { useEffect, useState } from 'react';
import Products from './components/Products';
import Cart from './components/Cart';
import CheckoutModal from './components/CheckoutModal';
import "./App.css"

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/products`).then(r => r.json()).then(setProducts);
    fetch(`${API}/api/cart`).then(r => r.json()).then(setCart);
  }, []);

  const refreshCart = () => {
    fetch(`${API}/api/cart`).then(r => r.json()).then(setCart);
  };

  const addToCart = async (productId, qty=1) => {
    await fetch(`${API}/api/cart`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ productId, qty })
    });
    refreshCart();
  };

  const removeCartItem = async (cartId) => {
    await fetch(`${API}/api/cart/${cartId}`, { method: 'DELETE' });
    refreshCart();
  };

  const updateCartQty = async (cartId, qty) => {
    await fetch(`${API}/api/cart/${cartId}`, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ qty })
    });
    refreshCart();
  };

  const handleCheckout = async (name, email) => {
    // send cart items to checkout
    const payload = { cartItems: cart.items.map(it => ({ productId: it.productId, qty: it.qty })), name, email };
    const res = await fetch(`${API}/api/checkout`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    const data = await res.json();
    setReceipt(data.receipt);
    setShowCheckout(false);
    setCart({ items: [], total: 0 });
  };

  return (
    <div className="app">
      <header>
        <h1>Vibe Commerce — Mock Cart</h1>
      </header>

      <main>
        <Products products={products} onAdd={addToCart} />
        <Cart
          cart={cart}
          onRemove={removeCartItem}
          onUpdateQty={updateCartQty}
          onCheckout={() => setShowCheckout(true)}
        />
      </main>

      {showCheckout && (
        <CheckoutModal onClose={() => setShowCheckout(false)} onSubmit={handleCheckout} />
      )}

      {receipt && (
        <div className="receipt">
          <h3>Receipt</h3>
          <p>Order id: {receipt.id}</p>
          <p>Name: {receipt.name}</p>
          <p>Email: {receipt.email}</p>
          <p>Total: ₹{receipt.total}</p>
          <p>Time: {new Date(receipt.timestamp).toLocaleString()}</p>
          <button onClick={() => setReceipt(null)}>Close</button>
        </div>
      )}
    </div>
  );
}
