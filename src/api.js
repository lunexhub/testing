import express from 'express';
import bookingService from './bookingService.js';

const router = express.Router();

// Tenant Management
router.post('/tenants', async (req, res) => {
  try {
    const tenant = await bookingService.createTenant(req.body);
    res.status(201).json(tenant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/tenants/:tenantId', async (req, res) => {
  try {
    const tenant = await bookingService.getTenant(req.params.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Template Management
router.post('/templates', async (req, res) => {
  try {
    const template = await bookingService.createTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/templates/:tenantId', async (req, res) => {
  try {
    const templates = await bookingService.getTemplates(req.params.tenantId);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Booking Management
router.post('/bookings', async (req, res) => {
  try {
    const booking = await bookingService.createBooking(req.body);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/bookings/:tenantId', async (req, res) => {
  try {
    const filters = {
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      status: req.query.status
    };
    const bookings = await bookingService.getBookings(req.params.tenantId, filters);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/booking/:bookingId', async (req, res) => {
  try {
    const booking = await bookingService.getBooking(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/booking/:bookingId', async (req, res) => {
  try {
    const booking = await bookingService.updateBooking(req.params.bookingId, req.body);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/booking/:bookingId/cancel', async (req, res) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.bookingId);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Notifications
router.get('/booking/:bookingId/notifications', async (req, res) => {
  try {
    const notifications = await bookingService.getNotifications(req.params.bookingId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
