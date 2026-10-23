import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'booking_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

export const query = (text, params) => pool.query(text, params);

export const initDatabase = async () => {
  try {
    // Create tenants table
    await query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create booking templates table
    await query(`
      CREATE TABLE IF NOT EXISTS booking_templates (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        template_name VARCHAR(255) NOT NULL,
        service_type VARCHAR(255) NOT NULL,
        duration_minutes INTEGER NOT NULL,
        default_message TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
        UNIQUE(tenant_id, template_name)
      )
    `);

    // Create bookings table
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(255) UNIQUE NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        service_type VARCHAR(255) NOT NULL,
        booking_date DATE NOT NULL,
        booking_time TIME NOT NULL,
        duration_minutes INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        voiceoffice_reference VARCHAR(255),
        meta_notification_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
      )
    `);

    // Create notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(255),
        notification_type VARCHAR(50) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        sent_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
      )
    `);

    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_templates_tenant_id ON booking_templates(tenant_id)');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export default { query, initDatabase };
