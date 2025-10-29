import React, { useState } from 'react';
import "../App.css"

export default function CheckoutModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const submit = () => {
    if (!name || !email) {
      alert('Please enter name and email');
      return;
    }
    onSubmit(name, email);
  };

  return (
    <div className="modal">
      <div className="modal-body">
        <h3>Checkout</h3>
        <label>
          Name
          <input value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <div className="modal-actions">
          <button onClick={submit}>Place order</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
