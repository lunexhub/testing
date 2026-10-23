import express from 'express';
import dotenv from 'dotenv';
import { initDatabase } from './database.js';
import api from './api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/api', api);

// Favicon handler (prevents 404 in browser)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'VoiceOffice Booking System',
    version: '1.0.0',
    description: 'Online booking system with multi-tenancy, templates, and Meta integration',
    endpoints: {
      tenants: '/api/tenants',
      templates: '/api/templates/:tenantId',
      bookings: '/api/bookings/:tenantId',
      health: '/api/health'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('Initializing database...');
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║   VoiceOffice Booking System                              ║
╟───────────────────────────────────────────────────────────╢
║   Server running on http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║                                                           ║
║   Features:                                               ║
║   ✓ Multi-tenancy support                                 ║
║   ✓ Booking templates                                     ║
║   ✓ VoiceOffice integration                               ║
║   ✓ Meta (WhatsApp) notifications                         ║
║                                                           ║
║   API Documentation: http://localhost:${PORT}/api          ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
