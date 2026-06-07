const crypto = require('crypto');
const { pool } = require('../config/db');

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
  } catch {
    return false;
  }
};

const mapUser = (row) => ({
  id: row.id,
  username: row.username,
  role: row.role,
  displayName: row.display_name,
  createdAt: row.created_at,
});

exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;

exports.findByUsername = async (username) => {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
};

exports.authenticate = async (username, password) => {
  const row = await exports.findByUsername(username);
  if (!row || !verifyPassword(password, row.password_hash)) {
    return null;
  }
  return mapUser(row);
};

exports.listPhotographers = async () => {
  const result = await pool.query(
    `SELECT u.*,
            COUNT(a.id)::int AS album_count
     FROM users u
     LEFT JOIN albums a ON a.owner_id = u.id
     WHERE u.role = 'photographer'
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  return result.rows.map((row) => ({
    ...mapUser(row),
    albumCount: row.album_count,
  }));
};

exports.createPhotographer = async ({ username, password, displayName }) => {
  const normalized = username.trim().toLowerCase();
  const hash = hashPassword(password);
  const result = await pool.query(
    `INSERT INTO users (username, password_hash, role, display_name)
     VALUES ($1, $2, 'photographer', $3)
     RETURNING *`,
    [normalized, hash, displayName?.trim() || normalized]
  );
  return mapUser(result.rows[0]);
};

exports.seedAdmin = async () => {
  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  let adminResult = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);

  if (adminResult.rows.length === 0) {
    adminResult = await pool.query(
      `INSERT INTO users (username, password_hash, role, display_name)
       VALUES ($1, $2, 'admin', 'Quản trị viên')
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [username, hashPassword(password)]
    );
  }

  if (adminResult.rows.length === 0) {
    adminResult = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  }

  const adminId = adminResult.rows[0]?.id;
  if (adminId) {
    await pool.query('UPDATE albums SET owner_id = $1 WHERE owner_id IS NULL', [adminId]);
  }
};
