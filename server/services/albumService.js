const { pool } = require('../config/db');

const mapAlbum = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  driveLink: row.drive_link,
  ownerId: row.owner_id,
  ownerName: row.owner_name,
  createdAt: row.created_at,
  imageCount: row.image_count != null ? Number(row.image_count) : undefined,
  selectedCount: row.selected_count != null ? Number(row.selected_count) : undefined,
});

exports.canManageAlbum = async (albumId, user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const result = await pool.query('SELECT owner_id FROM albums WHERE id = $1', [albumId]);
  if (result.rows.length === 0) return false;

  return result.rows[0].owner_id === user.userId;
};

exports.createAlbum = async ({ title, description, driveLink, ownerId }) => {
  const result = await pool.query(
    `INSERT INTO albums (title, description, drive_link, owner_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title.trim(), description?.trim() || '', driveLink?.trim() || null, ownerId]
  );
  return mapAlbum(result.rows[0]);
};

exports.getAlbums = async ({ userId, role }) => {
  const params = [];
  let ownerFilter = '';

  if (role !== 'admin') {
    params.push(userId);
    ownerFilter = `WHERE a.owner_id = $${params.length}`;
  }

  const result = await pool.query(
    `SELECT a.*,
            u.display_name AS owner_name,
            COUNT(i.id)::int AS image_count,
            COUNT(i.id) FILTER (WHERE i.is_selected = true)::int AS selected_count
     FROM albums a
     LEFT JOIN users u ON u.id = a.owner_id
     LEFT JOIN images i ON i.album_id = a.id
     ${ownerFilter}
     GROUP BY a.id, u.display_name
     ORDER BY a.created_at DESC`,
    params
  );
  return result.rows.map(mapAlbum);
};

exports.updateAlbum = async (id, { title, description, driveLink }) => {
  const result = await pool.query(
    `UPDATE albums
     SET title = $1, description = $2, drive_link = $3
     WHERE id = $4
     RETURNING *`,
    [title.trim(), description?.trim() || '', driveLink?.trim() || null, id]
  );
  if (result.rows.length === 0) return null;
  return exports.getAlbumById(id);
};

exports.deleteAlbum = async (id) => {
  const result = await pool.query('DELETE FROM albums WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
};

exports.getAlbumById = async (id) => {
  const albumResult = await pool.query(
    `SELECT a.*, u.display_name AS owner_name
     FROM albums a
     LEFT JOIN users u ON u.id = a.owner_id
     WHERE a.id = $1`,
    [id]
  );
  if (albumResult.rows.length === 0) return null;

  const statsResult = await pool.query(
    `SELECT COUNT(*)::int AS image_count,
            COUNT(*) FILTER (WHERE is_selected = true)::int AS selected_count
     FROM images WHERE album_id = $1`,
    [id]
  );

  return {
    ...mapAlbum(albumResult.rows[0]),
    imageCount: statsResult.rows[0].image_count,
    selectedCount: statsResult.rows[0].selected_count,
  };
};
