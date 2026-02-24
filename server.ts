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

  // In-memory store for orders and products
  let orders: any[] = [];
  let products: any[] = [];

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Send current state to new client
    ws.send(JSON.stringify({ type: 'INIT_DATA', payload: { orders, products } }));

    ws.on('close', () => console.log('Client disconnected'));
  });

  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

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
