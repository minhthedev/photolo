const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

const initDb = async () => {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS albums (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      drive_link TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      is_selected BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_images_album_id ON images(album_id);
    CREATE INDEX IF NOT EXISTS idx_images_album_selected ON images(album_id, is_selected);

    ALTER TABLE images ADD COLUMN IF NOT EXISTS file_name TEXT;
    ALTER TABLE images ADD COLUMN IF NOT EXISTS client_note TEXT;

    UPDATE images
    SET url = '/api/images/proxy/' || substring(url from 'id=([^&]+)')
    WHERE url LIKE '%drive.google.com%'
      AND url ~ 'id=([^&]+)'
      AND url NOT LIKE '/api/images/proxy/%';
  `);
};

module.exports = { pool, initDb };
