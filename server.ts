import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';
import { db } from './db';

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Helper to initialize default system values
const initSystem = async () => {
  const adminPassword = await db.getSystemValue('adminPassword');
  if (!adminPassword) {
    await db.setSystemValue('adminPassword', 'admin123');
  }
  const isDeliveryEnabled = await db.getSystemValue('isDeliveryEnabled');
  if (!isDeliveryEnabled) {
    await db.setSystemValue('isDeliveryEnabled', 'false');
  }
  const allowedAdminEmails = await db.getSystemValue('allowedAdminEmails');
  if (!allowedAdminEmails) {
    await db.setSystemValue('allowedAdminEmails', '');
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
    console.log('Found data.json, migrating to Database...');
    const dataStr = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(dataStr);

    if (data.adminPassword) await db.setSystemValue('adminPassword', data.adminPassword);
    if (data.isDeliveryEnabled !== undefined) await db.setSystemValue('isDeliveryEnabled', String(data.isDeliveryEnabled));
    
    if (data.products) await db.bulkInsert('products', data.products, 'id');
    if (data.orders) await db.bulkInsert('orders', data.orders, 'id');
    if (data.ingredients) await db.bulkInsert('ingredients', data.ingredients, 'name');
    if (data.volunteers) await db.bulkInsert('volunteers', data.volunteers, 'id');
    if (data.availability) await db.bulkInsert('availability', data.availability, 'id');

    console.log('Migration complete.');
    await fs.rename(DATA_FILE, `${DATA_FILE}.bak`);
  } catch (err) {
    // No data.json or already migrated
  }
};

async function startServer() {
  await db.init();
  await initSystem();
  await initEmail();
  await migrateData();

  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // WebSocket connection handling
  wss.on('connection', async (ws) => {
    console.log('Client connected');
    
    // Fetch current state
    const products = await db.getAll('products');
    const orders = await db.getAll('orders');
    const ingredients = await db.getAll('ingredients');
    const volunteers = await db.getAll('volunteers');
    const availability = await db.getAll('availability');
    const isDeliveryEnabledStr = await db.getSystemValue('isDeliveryEnabled');

    ws.send(JSON.stringify({ 
      type: 'INIT_DATA', 
      payload: { 
        orders, 
        products, 
        ingredients, 
        volunteers, 
        availability,
        isDeliveryEnabled: isDeliveryEnabledStr === 'true'
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
      const hasOrders = await db.hasOrderForIdentifier(identifier);

      if (!hasOrders) {
        return res.status(404).json({ error: 'No orders found for this identifier' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      await db.saveVerificationCode(identifier, code, expiresAt);

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

  app.post('/api/verify/check', async (req, res) => {
    const { identifier, code } = req.body;
    
    const record = await db.getVerificationCode(identifier);
    
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
    await db.deleteVerificationCode(identifier);
    
    res.json({ success: true });
  });

  // API Routes - Admin
  app.post('/api/admin/login', async (req, res) => {
    const { password } = req.body;
    const adminPassword = await db.getSystemValue('adminPassword');
    
    if (password === adminPassword) {
      const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
      await db.saveSession(sessionToken, expiresAt);
      res.json({ success: true, token: sessionToken });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  });

  app.post('/api/admin/verify', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ success: false });

    const session = await db.getSession(token);
    if (session && session.expires_at > Date.now()) {
      res.json({ success: true });
    } else {
      if (session) await db.deleteSession(token);
      res.status(401).json({ success: false });
    }
  });

  app.post('/api/admin/logout', async (req, res) => {
    const { token } = req.body;
    if (token) {
      await db.deleteSession(token);
    }
    res.json({ success: true });
  });

  app.post('/api/admin/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminPassword = await db.getSystemValue('adminPassword');

    if (currentPassword === adminPassword) {
      await db.setSystemValue('adminPassword', newPassword);
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Current password incorrect' });
    }
  });

  // API Routes - Products
  app.get('/api/products', async (req, res) => {
    const products = await db.getAll('products');
    res.json(products);
  });

  app.post('/api/products/sync', async (req, res) => {
    const products = await db.getAll('products');
    if (products.length === 0 && Array.isArray(req.body)) {
      await db.bulkInsert('products', req.body, 'id');
      broadcast({ type: 'UPDATE_PRODUCTS', payload: req.body });
      res.json(req.body);
    } else {
      res.json(products);
    }
  });

  app.post('/api/products', async (req, res) => {
    const newProduct = req.body;
    await db.insert('products', newProduct.id, newProduct);
    
    const products = await db.getAll('products');
    broadcast({ type: 'UPDATE_PRODUCTS', payload: products });
    res.status(201).json(newProduct);
  });

  app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    await db.delete('products', id);
    
    const products = await db.getAll('products');
    broadcast({ type: 'UPDATE_PRODUCTS', payload: products });
    res.status(204).send();
  });

  app.patch('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const product = await db.getById<any>('products', id);
    if (product) {
      const updatedProduct = { ...product, ...updates };
      await db.update('products', id, updatedProduct);
      
      const products = await db.getAll('products');
      broadcast({ type: 'UPDATE_PRODUCTS', payload: products });
      res.json(updatedProduct);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });

  // API Routes - Ingredients
  app.get('/api/ingredients', async (req, res) => {
    const ingredients = await db.getAll('ingredients');
    res.json(ingredients);
  });

  app.post('/api/ingredients/sync', async (req, res) => {
    const ingredients = await db.getAll('ingredients');
    if (ingredients.length === 0 && Array.isArray(req.body)) {
      await db.bulkInsert('ingredients', req.body, 'name');
      broadcast({ type: 'UPDATE_INGREDIENTS', payload: req.body });
      res.json(req.body);
    } else {
      res.json(ingredients);
    }
  });

  app.post('/api/ingredients', async (req, res) => {
    const newIngredient = req.body;
    await db.insert('ingredients', newIngredient.name, newIngredient);
    
    const ingredients = await db.getAll('ingredients');
    broadcast({ type: 'UPDATE_INGREDIENTS', payload: ingredients });
    res.status(201).json(newIngredient);
  });

  app.delete('/api/ingredients/:name', async (req, res) => {
    const { name } = req.params;
    await db.delete('ingredients', name);
    
    const ingredients = await db.getAll('ingredients');
    broadcast({ type: 'UPDATE_INGREDIENTS', payload: ingredients });
    res.status(204).send();
  });

  app.patch('/api/ingredients/:name', async (req, res) => {
    const { name } = req.params;
    const updates = req.body;
    
    const ingredient = await db.getById<any>('ingredients', name);
    if (ingredient) {
      const updatedIngredient = { ...ingredient, ...updates };
      await db.update('ingredients', name, updatedIngredient);
      
      const ingredients = await db.getAll('ingredients');
      broadcast({ type: 'UPDATE_INGREDIENTS', payload: ingredients });
      res.json(updatedIngredient);
    } else {
      res.status(404).json({ error: 'Ingredient not found' });
    }
  });

  // API Routes - Orders
  app.get('/api/orders', async (req, res) => {
    const orders = await db.getAll('orders');
    res.json(orders);
  });

  app.post('/api/orders', async (req, res) => {
    const newOrder = req.body;
    await db.insert('orders', newOrder.id, newOrder);
    
    broadcast({ type: 'NEW_ORDER', payload: newOrder });
    res.status(201).json(newOrder);
  });

  app.patch('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const order = await db.getById<any>('orders', id);
    if (order) {
      const updatedOrder = { ...order, ...updates };
      await db.update('orders', id, updatedOrder);
      
      broadcast({ type: 'UPDATE_ORDER', payload: updatedOrder });
      
      if (updates.isFulfilled === true) {
        broadcast({ type: 'NOTIFICATION', payload: { message: `Order ${updatedOrder.orderNumber} for ${updatedOrder.customerName} is ready for fulfillment!` } });
      }
      
      res.json(updatedOrder);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });

  app.post('/api/orders/:id/notify', async (req, res) => {
    const { id } = req.params;
    const { message, subject } = req.body;

    try {
      const order = await db.getById<any>('orders', id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (!order.customerEmail) {
        return res.status(400).json({ error: 'Customer has no email address' });
      }

      if (transporter) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"Living Water Wellness" <noreply@example.com>',
          to: order.customerEmail,
          subject: subject || 'Your Order is Ready!',
          text: message,
          html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        });
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Email service not configured' });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  // API Routes - Settings
  app.get('/api/settings', async (req, res) => {
    const isDeliveryEnabledStr = await db.getSystemValue('isDeliveryEnabled');
    res.json({ isDeliveryEnabled: isDeliveryEnabledStr === 'true' });
  });

  app.post('/api/settings/delivery', async (req, res) => {
    const { enabled } = req.body;
    await db.setSystemValue('isDeliveryEnabled', String(enabled));
    
    broadcast({ type: 'UPDATE_SETTINGS', payload: { isDeliveryEnabled: enabled } });
    res.json({ isDeliveryEnabled: enabled });
  });

  // API Routes - Volunteers
  app.get('/api/volunteers', async (req, res) => {
    const volunteers = await db.getAll('volunteers');
    res.json(volunteers);
  });

  app.post('/api/volunteers', async (req, res) => {
    const newVolunteer = req.body;
    await db.insert('volunteers', newVolunteer.id, newVolunteer);
    
    const volunteers = await db.getAll('volunteers');
    broadcast({ type: 'UPDATE_VOLUNTEERS', payload: volunteers });
    res.status(201).json(newVolunteer);
  });

  app.patch('/api/volunteers/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const volunteer = await db.getById<any>('volunteers', id);
    if (volunteer) {
      const updatedVolunteer = { ...volunteer, ...updates };
      await db.update('volunteers', id, updatedVolunteer);
      
      const volunteers = await db.getAll('volunteers');
      broadcast({ type: 'UPDATE_VOLUNTEERS', payload: volunteers });
      res.json(updatedVolunteer);
    } else {
      res.status(404).json({ error: 'Volunteer not found' });
    }
  });

  app.delete('/api/volunteers/:id', async (req, res) => {
    const { id } = req.params;
    await db.delete('volunteers', id);
    
    const volunteers = await db.getAll('volunteers');
    broadcast({ type: 'UPDATE_VOLUNTEERS', payload: volunteers });
    res.status(204).send();
  });

  // API Routes - Availability
  app.get('/api/availability', async (req, res) => {
    const availability = await db.getAll('availability');
    res.json(availability);
  });

  app.post('/api/availability', async (req, res) => {
    const newAvailability = req.body;
    await db.insert('availability', newAvailability.id, newAvailability);
    
    const availability = await db.getAll('availability');
    broadcast({ type: 'UPDATE_AVAILABILITY', payload: availability });
    res.status(201).json(newAvailability);
  });

  app.patch('/api/availability/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const avail = await db.getById<any>('availability', id);
    if (avail) {
      const updatedAvail = { ...avail, ...updates };
      await db.update('availability', id, updatedAvail);
      
      const availability = await db.getAll('availability');
      broadcast({ type: 'UPDATE_AVAILABILITY', payload: availability });
      res.json(updatedAvail);
    } else {
      res.status(404).json({ error: 'Availability not found' });
    }
  });

  app.delete('/api/availability/:id', async (req, res) => {
    const { id } = req.params;
    await db.delete('availability', id);
    
    const availability = await db.getAll('availability');
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
