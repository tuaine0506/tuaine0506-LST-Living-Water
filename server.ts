import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // In-memory store for orders, products, ingredients, volunteers, and availability
  let orders: any[] = [];
  let products: any[] = [];
  let ingredients: any[] = [];
  let volunteers: any[] = [];
  let availability: any[] = [];
  let adminPassword = 'admin123';

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Send current state to new client
    ws.send(JSON.stringify({ type: 'INIT_DATA', payload: { orders, products, ingredients, volunteers, availability } }));

    ws.on('close', () => console.log('Client disconnected'));
  });

  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // API Routes - Admin
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === adminPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  });

  app.post('/api/admin/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (currentPassword === adminPassword) {
      adminPassword = newPassword;
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Current password incorrect' });
    }
  });

  // API Routes - Products
  app.get('/api/products', (req, res) => {
    res.json(products);
  });

  app.post('/api/products/sync', (req, res) => {
    // Initial sync from client if server is empty
    if (products.length === 0 && Array.isArray(req.body)) {
      products = req.body;
      broadcast({ type: 'UPDATE_PRODUCTS', payload: products });
    }
    res.json(products);
  });

  app.post('/api/products', (req, res) => {
    const newProduct = req.body;
    products.push(newProduct);
    broadcast({ type: 'UPDATE_PRODUCTS', payload: products });
    res.status(201).json(newProduct);
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    products = products.filter(p => p.id !== id);
    broadcast({ type: 'UPDATE_PRODUCTS', payload: products });
    res.status(204).send();
  });

  app.patch('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex !== -1) {
      products[productIndex] = { ...products[productIndex], ...updates };
      broadcast({ type: 'UPDATE_PRODUCTS', payload: products });
      res.json(products[productIndex]);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });

  // API Routes - Ingredients
  app.get('/api/ingredients', (req, res) => {
    res.json(ingredients);
  });

  app.post('/api/ingredients/sync', (req, res) => {
    if (ingredients.length === 0 && Array.isArray(req.body)) {
      ingredients = req.body;
      broadcast({ type: 'UPDATE_INGREDIENTS', payload: ingredients });
    }
    res.json(ingredients);
  });

  app.post('/api/ingredients', (req, res) => {
    const newIngredient = req.body;
    ingredients.push(newIngredient);
    broadcast({ type: 'UPDATE_INGREDIENTS', payload: ingredients });
    res.status(201).json(newIngredient);
  });

  app.delete('/api/ingredients/:name', (req, res) => {
    const { name } = req.params;
    ingredients = ingredients.filter(i => i.name !== name);
    broadcast({ type: 'UPDATE_INGREDIENTS', payload: ingredients });
    res.status(204).send();
  });

  app.patch('/api/ingredients/:name', (req, res) => {
    const { name } = req.params;
    const updates = req.body;
    const ingredientIndex = ingredients.findIndex(i => i.name === name);
    
    if (ingredientIndex !== -1) {
      ingredients[ingredientIndex] = { ...ingredients[ingredientIndex], ...updates };
      broadcast({ type: 'UPDATE_INGREDIENTS', payload: ingredients });
      res.json(ingredients[ingredientIndex]);
    } else {
      res.status(404).json({ error: 'Ingredient not found' });
    }
  });

  // API Routes - Orders
  app.get('/api/orders', (req, res) => {
    res.json(orders);
  });

  app.post('/api/orders', (req, res) => {
    const newOrder = req.body;
    orders.push(newOrder);
    broadcast({ type: 'NEW_ORDER', payload: newOrder });
    res.status(201).json(newOrder);
  });

  app.patch('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const orderIndex = orders.findIndex(o => o.id === id);
    
    if (orderIndex !== -1) {
      orders[orderIndex] = { ...orders[orderIndex], ...updates };
      broadcast({ type: 'UPDATE_ORDER', payload: orders[orderIndex] });
      
      // If order was just fulfilled, send a specific notification
      if (updates.isFulfilled === true) {
        broadcast({ type: 'NOTIFICATION', payload: { message: `Order ${orders[orderIndex].orderNumber} for ${orders[orderIndex].customerName} is ready for fulfillment!` } });
      }
      
      res.json(orders[orderIndex]);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });

  // API Routes - Volunteers
  app.get('/api/volunteers', (req, res) => {
    res.json(volunteers);
  });

  app.post('/api/volunteers', (req, res) => {
    const newVolunteer = req.body;
    volunteers.push(newVolunteer);
    broadcast({ type: 'UPDATE_VOLUNTEERS', payload: volunteers });
    res.status(201).json(newVolunteer);
  });

  app.patch('/api/volunteers/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const index = volunteers.findIndex(v => v.id === id);
    if (index !== -1) {
      volunteers[index] = { ...volunteers[index], ...updates };
      broadcast({ type: 'UPDATE_VOLUNTEERS', payload: volunteers });
      res.json(volunteers[index]);
    } else {
      res.status(404).json({ error: 'Volunteer not found' });
    }
  });

  app.delete('/api/volunteers/:id', (req, res) => {
    const { id } = req.params;
    volunteers = volunteers.filter(v => v.id !== id);
    broadcast({ type: 'UPDATE_VOLUNTEERS', payload: volunteers });
    res.status(204).send();
  });

  // API Routes - Availability
  app.get('/api/availability', (req, res) => {
    res.json(availability);
  });

  app.post('/api/availability', (req, res) => {
    const newAvailability = req.body;
    availability.push(newAvailability);
    broadcast({ type: 'UPDATE_AVAILABILITY', payload: availability });
    res.status(201).json(newAvailability);
  });

  app.patch('/api/availability/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const index = availability.findIndex(a => a.id === id);
    if (index !== -1) {
      availability[index] = { ...availability[index], ...updates };
      broadcast({ type: 'UPDATE_AVAILABILITY', payload: availability });
      res.json(availability[index]);
    } else {
      res.status(404).json({ error: 'Availability not found' });
    }
  });

  app.delete('/api/availability/:id', (req, res) => {
    const { id } = req.params;
    availability = availability.filter(a => a.id !== id);
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
