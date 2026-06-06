const { pool } = require('../config/db');

const mapAlbum = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  driveLink: row.drive_link,
  createdAt: row.created_at,
  imageCount: row.image_count != null ? Number(row.image_count) : undefined,
  selectedCount: row.selected_count != null ? Number(row.selected_count) : undefined,
});

exports.createAlbum = async ({ title, description, driveLink }) => {
  const result = await pool.query(
    `INSERT INTO albums (title, description, drive_link)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [title.trim(), description?.trim() || '', driveLink?.trim() || null]
  );
  return mapAlbum(result.rows[0]);
};

exports.getAlbums = async () => {
  const result = await pool.query(
    `SELECT a.*,
            COUNT(i.id)::int AS image_count,
            COUNT(i.id) FILTER (WHERE i.is_selected = true)::int AS selected_count
     FROM albums a
     LEFT JOIN images i ON i.album_id = a.id
     GROUP BY a.id
     ORDER BY a.created_at DESC`
  );
  return result.rows.map(mapAlbum);
};

exports.getAlbumById = async (id) => {
  const albumResult = await pool.query('SELECT * FROM albums WHERE id = $1', [id]);
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
