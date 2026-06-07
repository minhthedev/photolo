const { Pool } = require('pg');

const getSslConfig = () => {
  const url = process.env.DATABASE_URL || '';

  if (
    url.includes('neon.tech') ||
    url.includes('sslmode=require') ||
    url.includes('sslmode=verify-full')
  ) {
    return { rejectUnauthorized: false };
  }

  return false;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getSslConfig(),
  connectionTimeoutMillis: 15000,
  max: 5,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runMigrations = async () => {
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
    CREATE INDEX IF NOT EXISTS idx_images_album_created ON images(album_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_images_album_selected ON images(album_id, is_selected);

    ALTER TABLE images ADD COLUMN IF NOT EXISTS file_name TEXT;
    ALTER TABLE images ADD COLUMN IF NOT EXISTS client_note TEXT;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'photographer')),
      display_name TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE albums ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_albums_owner_id ON albums(owner_id);

    UPDATE images
    SET url = '/api/images/proxy/' || substring(url from 'id=([^&]+)')
    WHERE url LIKE '%drive.google.com%'
      AND url ~ 'id=([^&]+)'
      AND url NOT LIKE '/api/images/proxy/%';
  `);

  const userService = require('../services/userService');
  await userService.seedAdmin();
};

const initDb = async () => {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL chưa được cấu hình');
  }

  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await runMigrations();
      return;
    } catch (error) {
      console.error(`Database connect attempt ${attempt}/${maxAttempts} failed:`, error.message);

      if (attempt === maxAttempts) {
        throw error;
      }

      await sleep(3000);
    }
  }
};

module.exports = { pool, initDb };
