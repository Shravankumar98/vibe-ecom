import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

const db = new Database(path.join(__dirname, 'db.sqlite'));

// Initialize tables & seed products if not exists
db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS cart (
  id INTEGER PRIMARY KEY,
  productId INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  FOREIGN KEY(productId) REFERENCES products(id)
);
`);

// Seed products if empty
const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (count === 0) {
  const products = [
    { name: 'Vibe T-shirt', price: 249.99 },
    { name: 'Vibe Hoodie', price: 799.00 },
    { name: 'Vibe Mug', price: 149.50 },
    { name: 'Vibe Cap', price: 199.75 },
    { name: 'Vibe Stickers (Pack)', price: 49.90 }
  ];
  const insert = db.prepare('INSERT INTO products (name, price) VALUES (?, ?)');
  const insertMany = db.transaction((items) => {
    for (const p of items) insert.run(p.name, p.price);
  });
  insertMany(products);
  console.log('Seeded products.');
}

// Helper to compute cart with product info & total
function getCartWithTotal() {
  const items = db.prepare(`
    SELECT c.id as cartId, c.productId, c.qty, p.name, p.price
    FROM cart c
    JOIN products p ON p.id = c.productId
  `).all();

  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  return { items, total: Number(total.toFixed(2)) };
}

// Routes

// GET /api/products
app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT id, name, price FROM products').all();
  res.json(products);
});

// GET /api/cart
app.get('/api/cart', (req, res) => {
  res.json(getCartWithTotal());
});

// POST /api/cart  { productId, qty }
app.post('/api/cart', (req, res) => {
  const { productId, qty } = req.body;
  if (!productId || !qty || qty <= 0) {
    return res.status(400).json({ error: 'Invalid productId or qty' });
  }

  // If product already in cart, increase qty
  const existing = db.prepare('SELECT id, qty FROM cart WHERE productId = ?').get(productId);
  if (existing) {
    db.prepare('UPDATE cart SET qty = qty + ? WHERE id = ?').run(qty, existing.id);
    return res.json(getCartWithTotal());
  }

  const info = db.prepare('INSERT INTO cart (productId, qty) VALUES (?, ?)').run(productId, qty);
  res.json(getCartWithTotal());
});

// DELETE /api/cart/:id  (cart item id)
app.delete('/api/cart/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM cart WHERE id = ?').run(id);
  res.json(getCartWithTotal());
});

// PATCH /api/cart/:id  -- update qty
app.patch('/api/cart/:id', (req, res) => {
  const { id } = req.params;
  const { qty } = req.body;
  if (qty == null || qty < 0) return res.status(400).json({ error: 'Invalid qty' });
  if (qty === 0) {
    db.prepare('DELETE FROM cart WHERE id = ?').run(id);
  } else {
    db.prepare('UPDATE cart SET qty = ? WHERE id = ?').run(qty, id);
  }
  res.json(getCartWithTotal());
});

// POST /api/checkout  { cartItems, name, email } -> mock receipt
app.post('/api/checkout', (req, res) => {
  const { cartItems, name, email } = req.body;
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart empty' });
  }

  // compute total
  const productStmt = db.prepare('SELECT id, name, price FROM products WHERE id = ?');
  let total = 0;
  const items = cartItems.map(ci => {
    const p = productStmt.get(ci.productId);
    const qty = Number(ci.qty) || 1;
    const amount = Number((p.price * qty).toFixed(2));
    total += amount;
    return { productId: p.id, name: p.name, price: p.price, qty, amount };
  });
  total = Number(total.toFixed(2));

  // Clear cart table (mock checkout)
  db.prepare('DELETE FROM cart').run();

  const receipt = {
    id: Date.now(),
    name: name || null,
    email: email || null,
    items,
    total,
    timestamp: new Date().toISOString()
  };

  // In a real app we'd persist order. Here return receipt.
  res.json({ receipt });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));