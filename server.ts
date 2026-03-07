import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import fs from 'fs/promises';
import path from 'path';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';

const DB_FILE = path.join(process.cwd(), 'database.sqlite');
const DATA_FILE = path.join(process.cwd(), 'data.json');

// Initialize Database
const db = new Database(DB_FILE);

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS system (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS ingredients (
    name TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS volunteers (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS availability (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS verification_codes (
    identifier TEXT PRIMARY KEY,
    code TEXT,
    expires_at INTEGER
  );
`);

// Helper to initialize default system values
const initSystem = () => {
  const adminPassword = db.prepare('SELECT value FROM system WHERE key = ?').get('adminPassword');
  if (!adminPassword) {
    db.prepare('INSERT INTO system (key, value) VALUES (?, ?)').run('adminPassword', 'admin123');
  }
  const isDeliveryEnabled = db.prepare('SELECT value FROM system WHERE key = ?').get('isDeliveryEnabled');
  if (!isDeliveryEnabled) {
    db.prepare('INSERT INTO system (key, value) VALUES (?, ?)').run('isDeliveryEnabled', 'false');
  }
};

let transporter: nodemailer.Transporter;

const initEmail = async () => {
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('SMTP configured from environment variables');
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Ethereal Email configured for testing');
    } catch (err) {
      console.error('Failed to create test email account', err);
    }
  }
};

// Migration from data.json
const migrateData = async () => {
  try {
    await fs.access(DATA_FILE);
    console.log('Found data.json, migrating to SQLite...');
    const dataStr = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(dataStr);

    const insertSystem = db.prepare('INSERT OR REPLACE INTO system (key, value) VALUES (?, ?)');
    const insertProduct = db.prepare('INSERT OR REPLACE INTO products (id, data) VALUES (?, ?)');
    const insertOrder = db.prepare('INSERT OR REPLACE INTO orders (id, data) VALUES (?, ?)');
    const insertIngredient = db.prepare('INSERT OR REPLACE INTO ingredients (name, data) VALUES (?, ?)');
    const insertVolunteer = db.prepare('INSERT OR REPLACE INTO volunteers (id, data) VALUES (?, ?)');
    const insertAvailability = db.prepare('INSERT OR REPLACE INTO availability (id, data) VALUES (?, ?)');

    const transaction = db.transaction(() => {
      if (data.adminPassword) insertSystem.run('adminPassword', data.adminPassword);
      if (data.isDeliveryEnabled !== undefined) insertSystem.run('isDeliveryEnabled', String(data.isDeliveryEnabled));
      
      data.products?.forEach((p: any) => insertProduct.run(p.id, JSON.stringify(p)));
      data.orders?.forEach((o: any) => insertOrder.run(o.id, JSON.stringify(o)));
      data.ingredients?.forEach((i: any) => insertIngredient.run(i.name, JSON.stringify(i)));
      data.volunteers?.forEach((v: any) => insertVolunteer.run(v.id, JSON.stringify(v)));
      data.availability?.forEach((a: any) => insertAvailability.run(a.id, JSON.stringify(a)));
    });

    transaction();
    console.log('Migration complete.');
    await fs.rename(DATA_FILE, `${DATA_FILE}.bak`);
  } catch (err) {
    // No data.json or already migrated
  }
};

async function startServer() {
  initSystem();
  await initEmail();
  await migrateData();

  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Fetch current state
    const products = db.prepare('SELECT data FROM products').all().map((row: any) => JSON.parse(row.data));
    const orders = db.prepare('SELECT data FROM orders').all().map((row: any) => JSON.parse(row.data));
    const ingredients = db.prepare('SELECT data FROM ingredients').all().map((row: any) => JSON.parse(row.data));
    const volunteers = db.prepare('SELECT data FROM volunteers').all().map((row: any) => JSON.parse(row.data));
    const availability = db.prepare('SELECT data FROM availability').all().map((row: any) => JSON.parse(row.data));
    const isDeliveryEnabled = db.prepare('SELECT value FROM system WHERE key = ?').get('isDeliveryEnabled') as { value: string };

    ws.send(JSON.stringify({ 
      type: 'INIT_DATA', 
      payload: { 
        orders, 
        products, 
        ingredients, 
        volunteers, 
        availability,
        isDeliveryEnabled: isDeliveryEnabled?.value === 'true'
      } 
    }));

    ws.on('close', () => console.log('Client disconnected'));
  });

  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // API Routes - Verification
  app.post('/api/verify/send', async (req, res) => {
    const { identifier } = req.body;
    
    try {
      // Use SQL query with json_extract for efficiency
      const hasOrders = db.prepare(`
        SELECT 1 FROM orders 
        WHERE json_extract(data, '$.customerEmail') = ? 
        OR json_extract(data, '$.customerContact') = ?
      `).get(identifier, identifier);

      if (!hasOrders) {
        return res.status(404).json({ error: 'No orders found for this identifier' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      db.prepare('INSERT OR REPLACE INTO verification_codes (identifier, code, expires_at) VALUES (?, ?, ?)').run(identifier, code, expiresAt);

      if (identifier.includes('@') && transporter) {
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || '"Living Water Wellness" <noreply@example.com>',
          to: identifier,
          subject: 'Your Verification Code',
          text: `Your verification code is: ${code}`,
          html: `<p>Your verification code is: <strong>${code}</strong></p>`,
        });

        console.log('Message sent: %s', info.messageId);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('Preview URL: %s', previewUrl);
        }
        
        res.json({ success: true, previewUrl });
      } else {
        console.log(`[DEMO] Verification code for ${identifier}: ${code}`);
        res.json({ success: true, code }); // Return code for demo/phone
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  });

  app.post('/api/verify/check', (req, res) => {
    const { identifier, code } = req.body;
    
    const record = db.prepare('SELECT * FROM verification_codes WHERE identifier = ?').get(identifier) as any;
    
    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    
    if (record.code !== code) {
      return res.status(400).json({ error: 'Invalid code' });
    }
    
    if (Date.now() > record.expires_at) {
      return res.status(400).json({ error: 'Code expired' });
    }
    
    // Success - delete code to prevent reuse
    db.prepare('DELETE FROM verification_codes WHERE identifier = ?').run(identifier);
    
    res.json({ success: true });
  });

  // API Routes - Admin
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = db.prepare('SELECT value FROM system WHERE key = ?').get('adminPassword') as { value: string };
    
    if (password === adminPassword.value) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  });

  app.post('/api/admin/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminPassword = db.prepare('SELECT value FROM system WHERE key = ?').get('adminPassword') as { value: string };

    if (currentPassword === adminPassword.value) {
      db.prepare('UPDATE system SET value = ? WHERE key = ?').run(newPassword, 'adminPassword');
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Current password incorrect' });
    }
  });

  // API Routes - Products
  app.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT data FROM products').all().map((row: any) => JSON.parse(row.data));
    res.json(products);
  });

  app.post('/api/products/sync', (req, res) => {
    const count = db.prepare('SELECT count(*) as count FROM products').get() as { count: number };
    if (count.count === 0 && Array.isArray(req.body)) {
      const insert = db.prepare('INSERT INTO products (id, data) VALUES (?, ?)');
      const transaction = db.transaction((products) => {
        for (const p of products) insert.run(p.id, JSON.stringify(p));
      });
      transaction(req.body);
      const products = req.body;
      broadcast({ type: 'UPDATE_PRODUCTS', payload: products });
      res.json(products);
    } else {
      const products = db.prepare('SELECT data FROM products').all().map((row: any) => JSON.parse(row.data));
      res.json(products);
    }
  });

  app.post('/api/products', (req, res) => {
    const newProduct = req.body;
    db.prepare('INSERT INTO products (id, data) VALUES (?, ?)').run(newProduct.id, JSON.stringify(newProduct));
    
    const products = db.prepare('SELECT data FROM products').all().map((row: any) => JSON.parse(row.data));
    broadcast({ type: 'UPDATE_PRODUCTS', payload: products });
    res.status(201).json(newProduct);
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    
    const products = db.prepare('SELECT data FROM products').all().map((row: any) => JSON.parse(row.data));
    broadcast({ type: 'UPDATE_PRODUCTS', payload: products });
    res.status(204).send();
  });

  app.patch('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const row = db.prepare('SELECT data FROM products WHERE id = ?').get(id) as { data: string };
    if (row) {
      const product = JSON.parse(row.data);
      const updatedProduct = { ...product, ...updates };
      db.prepare('UPDATE products SET data = ? WHERE id = ?').run(JSON.stringify(updatedProduct), id);
      
      const products = db.prepare('SELECT data FROM products').all().map((row: any) => JSON.parse(row.data));
      broadcast({ type: 'UPDATE_PRODUCTS', payload: products });
      res.json(updatedProduct);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });

  // API Routes - Ingredients
  app.get('/api/ingredients', (req, res) => {
    const ingredients = db.prepare('SELECT data FROM ingredients').all().map((row: any) => JSON.parse(row.data));
    res.json(ingredients);
  });

  app.post('/api/ingredients/sync', (req, res) => {
    const count = db.prepare('SELECT count(*) as count FROM ingredients').get() as { count: number };
    if (count.count === 0 && Array.isArray(req.body)) {
      const insert = db.prepare('INSERT INTO ingredients (name, data) VALUES (?, ?)');
      const transaction = db.transaction((ingredients) => {
        for (const i of ingredients) insert.run(i.name, JSON.stringify(i));
      });
      transaction(req.body);
      const ingredients = req.body;
      broadcast({ type: 'UPDATE_INGREDIENTS', payload: ingredients });
      res.json(ingredients);
    } else {
      const ingredients = db.prepare('SELECT data FROM ingredients').all().map((row: any) => JSON.parse(row.data));
      res.json(ingredients);
    }
  });

  app.post('/api/ingredients', (req, res) => {
    const newIngredient = req.body;
    db.prepare('INSERT INTO ingredients (name, data) VALUES (?, ?)').run(newIngredient.name, JSON.stringify(newIngredient));
    
    const ingredients = db.prepare('SELECT data FROM ingredients').all().map((row: any) => JSON.parse(row.data));
    broadcast({ type: 'UPDATE_INGREDIENTS', payload: ingredients });
    res.status(201).json(newIngredient);
  });

  app.delete('/api/ingredients/:name', (req, res) => {
    const { name } = req.params;
    db.prepare('DELETE FROM ingredients WHERE name = ?').run(name);
    
    const ingredients = db.prepare('SELECT data FROM ingredients').all().map((row: any) => JSON.parse(row.data));
    broadcast({ type: 'UPDATE_INGREDIENTS', payload: ingredients });
    res.status(204).send();
  });

  app.patch('/api/ingredients/:name', (req, res) => {
    const { name } = req.params;
    const updates = req.body;
    
    const row = db.prepare('SELECT data FROM ingredients WHERE name = ?').get(name) as { data: string };
    if (row) {
      const ingredient = JSON.parse(row.data);
      const updatedIngredient = { ...ingredient, ...updates };
      db.prepare('UPDATE ingredients SET data = ? WHERE name = ?').run(JSON.stringify(updatedIngredient), name);
      
      const ingredients = db.prepare('SELECT data FROM ingredients').all().map((row: any) => JSON.parse(row.data));
      broadcast({ type: 'UPDATE_INGREDIENTS', payload: ingredients });
      res.json(updatedIngredient);
    } else {
      res.status(404).json({ error: 'Ingredient not found' });
    }
  });

  // API Routes - Orders
  app.get('/api/orders', (req, res) => {
    const orders = db.prepare('SELECT data FROM orders').all().map((row: any) => JSON.parse(row.data));
    res.json(orders);
  });

  app.post('/api/orders', (req, res) => {
    const newOrder = req.body;
    db.prepare('INSERT INTO orders (id, data) VALUES (?, ?)').run(newOrder.id, JSON.stringify(newOrder));
    
    broadcast({ type: 'NEW_ORDER', payload: newOrder });
    res.status(201).json(newOrder);
  });

  app.patch('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const row = db.prepare('SELECT data FROM orders WHERE id = ?').get(id) as { data: string };
    if (row) {
      const order = JSON.parse(row.data);
      const updatedOrder = { ...order, ...updates };
      db.prepare('UPDATE orders SET data = ? WHERE id = ?').run(JSON.stringify(updatedOrder), id);
      
      broadcast({ type: 'UPDATE_ORDER', payload: updatedOrder });
      
      if (updates.isFulfilled === true) {
        broadcast({ type: 'NOTIFICATION', payload: { message: `Order ${updatedOrder.orderNumber} for ${updatedOrder.customerName} is ready for fulfillment!` } });
      }
      
      res.json(updatedOrder);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });

  // API Routes - Settings
  app.get('/api/settings', (req, res) => {
    const isDeliveryEnabled = db.prepare('SELECT value FROM system WHERE key = ?').get('isDeliveryEnabled') as { value: string };
    res.json({ isDeliveryEnabled: isDeliveryEnabled?.value === 'true' });
  });

  app.post('/api/settings/delivery', (req, res) => {
    const { enabled } = req.body;
    db.prepare('UPDATE system SET value = ? WHERE key = ?').run(String(enabled), 'isDeliveryEnabled');
    
    broadcast({ type: 'UPDATE_SETTINGS', payload: { isDeliveryEnabled: enabled } });
    res.json({ isDeliveryEnabled: enabled });
  });

  // API Routes - Volunteers
  app.get('/api/volunteers', (req, res) => {
    const volunteers = db.prepare('SELECT data FROM volunteers').all().map((row: any) => JSON.parse(row.data));
    res.json(volunteers);
  });

  app.post('/api/volunteers', (req, res) => {
    const newVolunteer = req.body;
    db.prepare('INSERT INTO volunteers (id, data) VALUES (?, ?)').run(newVolunteer.id, JSON.stringify(newVolunteer));
    
    const volunteers = db.prepare('SELECT data FROM volunteers').all().map((row: any) => JSON.parse(row.data));
    broadcast({ type: 'UPDATE_VOLUNTEERS', payload: volunteers });
    res.status(201).json(newVolunteer);
  });

  app.patch('/api/volunteers/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const row = db.prepare('SELECT data FROM volunteers WHERE id = ?').get(id) as { data: string };
    if (row) {
      const volunteer = JSON.parse(row.data);
      const updatedVolunteer = { ...volunteer, ...updates };
      db.prepare('UPDATE volunteers SET data = ? WHERE id = ?').run(JSON.stringify(updatedVolunteer), id);
      
      const volunteers = db.prepare('SELECT data FROM volunteers').all().map((row: any) => JSON.parse(row.data));
      broadcast({ type: 'UPDATE_VOLUNTEERS', payload: volunteers });
      res.json(updatedVolunteer);
    } else {
      res.status(404).json({ error: 'Volunteer not found' });
    }
  });

  app.delete('/api/volunteers/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM volunteers WHERE id = ?').run(id);
    
    const volunteers = db.prepare('SELECT data FROM volunteers').all().map((row: any) => JSON.parse(row.data));
    broadcast({ type: 'UPDATE_VOLUNTEERS', payload: volunteers });
    res.status(204).send();
  });

  // API Routes - Availability
  app.get('/api/availability', (req, res) => {
    const availability = db.prepare('SELECT data FROM availability').all().map((row: any) => JSON.parse(row.data));
    res.json(availability);
  });

  app.post('/api/availability', (req, res) => {
    const newAvailability = req.body;
    db.prepare('INSERT INTO availability (id, data) VALUES (?, ?)').run(newAvailability.id, JSON.stringify(newAvailability));
    
    const availability = db.prepare('SELECT data FROM availability').all().map((row: any) => JSON.parse(row.data));
    broadcast({ type: 'UPDATE_AVAILABILITY', payload: availability });
    res.status(201).json(newAvailability);
  });

  app.patch('/api/availability/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const row = db.prepare('SELECT data FROM availability WHERE id = ?').get(id) as { data: string };
    if (row) {
      const avail = JSON.parse(row.data);
      const updatedAvail = { ...avail, ...updates };
      db.prepare('UPDATE availability SET data = ? WHERE id = ?').run(JSON.stringify(updatedAvail), id);
      
      const availability = db.prepare('SELECT data FROM availability').all().map((row: any) => JSON.parse(row.data));
      broadcast({ type: 'UPDATE_AVAILABILITY', payload: availability });
      res.json(updatedAvail);
    } else {
      res.status(404).json({ error: 'Availability not found' });
    }
  });

  app.delete('/api/availability/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM availability WHERE id = ?').run(id);
    
    const availability = db.prepare('SELECT data FROM availability').all().map((row: any) => JSON.parse(row.data));
    broadcast({ type: 'UPDATE_AVAILABILITY', payload: availability });
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

