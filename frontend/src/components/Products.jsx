import React from 'react';
import "../App.css"

export default function Products({ products, onAdd }) {
  return (
    <section className="products">
      <h2>Products</h2>
      <div className="grid">
        {products.map(p => (
          <div key={p.id} className="card">
            <div className="name">{p.name}</div>
            <div className="price">₹{p.price.toFixed(2)}</div>
            <div className="actions">
              <button onClick={() => onAdd(p.id, 1)}>Add to cart</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
