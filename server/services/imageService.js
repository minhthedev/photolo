const { pool } = require('../config/db');
const driveService = require('./driveService');

const mapImage = (row) => ({
  id: row.id,
  albumId: row.album_id,
  url: row.url,
  fileName: row.file_name || null,
  isSelected: row.is_selected,
  clientNote: row.client_note || null,
  createdAt: row.created_at,
});

exports.addImage = async ({ albumId, url }) => {
  const albumCheck = await pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
  if (albumCheck.rows.length === 0) {
    return null;
  }

  const result = await pool.query(
    `INSERT INTO images (album_id, url)
     VALUES ($1, $2)
     RETURNING *`,
    [albumId, url.trim()]
  );
  return mapImage(result.rows[0]);
};

exports.getImagesByAlbum = async (albumId, { page = 1, limit = 24 } = {}) => {
  const albumCheck = await pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
  if (albumCheck.rows.length === 0) {
    return null;
  }

  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    'SELECT COUNT(*)::int AS total FROM images WHERE album_id = $1',
    [albumId]
  );

  const result = await pool.query(
    `SELECT * FROM images
     WHERE album_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [albumId, limit, offset]
  );

  const selectedResult = await pool.query(
    'SELECT COUNT(*)::int AS selected_count FROM images WHERE album_id = $1 AND is_selected = true',
    [albumId]
  );

  return {
    images: result.rows.map(mapImage),
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit) || 1,
      hasMore: offset + result.rows.length < countResult.rows[0].total,
    },
    selectedCount: selectedResult.rows[0].selected_count,
  };
};

exports.getSelectedImagesByAlbum = async (albumId) => {
  const albumCheck = await pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
  if (albumCheck.rows.length === 0) {
    return null;
  }

  const result = await pool.query(
    `SELECT * FROM images
     WHERE album_id = $1 AND is_selected = true
     ORDER BY created_at DESC`,
    [albumId]
  );
  return result.rows.map(mapImage);
};

exports.getAllImagesByAlbum = async (albumId) => {
  const result = await pool.query(
    `SELECT * FROM images WHERE album_id = $1 ORDER BY created_at DESC`,
    [albumId]
  );
  return result.rows.map(mapImage);
};

exports.toggleSelection = async (id) => {
  const result = await pool.query(
    `UPDATE images
     SET is_selected = NOT is_selected,
         client_note = CASE WHEN is_selected = true THEN NULL ELSE client_note END
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return mapImage(result.rows[0]);
};

exports.updateClientNote = async (id, note) => {
  const result = await pool.query(
    `UPDATE images
     SET client_note = $2
     WHERE id = $1 AND is_selected = true
     RETURNING *`,
    [id, note?.trim() || null]
  );
  if (result.rows.length === 0) return null;
  return mapImage(result.rows[0]);
};

exports.syncFromDrive = async (albumId) => {
  const albumResult = await pool.query(
    'SELECT id, drive_link FROM albums WHERE id = $1',
    [albumId]
  );

  if (albumResult.rows.length === 0) {
    return { error: 'NOT_FOUND', message: 'Album không tồn tại' };
  }

  const driveLink = albumResult.rows[0].drive_link;
  if (!driveLink) {
    return { error: 'NO_DRIVE_LINK', message: 'Album chưa có link Google Drive' };
  }

  let driveImages;
  try {
    driveImages = await driveService.getImagesFromLink(driveLink);
  } catch (err) {
    return {
      error: err.code || 'SYNC_FAILED',
      message: err.message,
    };
  }

  const UPDATE_BATCH = 200;
  for (let i = 0; i < driveImages.length; i += UPDATE_BATCH) {
    const batch = driveImages.slice(i, i + UPDATE_BATCH);
    const values = [albumId];
    const tuples = batch
      .map((img, idx) => {
        values.push(img.url, img.fileName);
        const base = idx * 2 + 2;
        return `($${base}, $${base + 1})`;
      })
      .join(', ');

    await pool.query(
      `UPDATE images AS i SET file_name = v.file_name
       FROM (VALUES ${tuples}) AS v(url, file_name)
       WHERE i.album_id = $1 AND i.url = v.url`,
      values
    );
  }

  const existingResult = await pool.query(
    'SELECT url FROM images WHERE album_id = $1',
    [albumId]
  );
  const existingUrls = new Set(existingResult.rows.map((row) => row.url));
  const newImages = driveImages.filter((img) => !existingUrls.has(img.url));

  const BATCH_SIZE = 100;
  for (let i = 0; i < newImages.length; i += BATCH_SIZE) {
    const batch = newImages.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = batch
      .map((img, idx) => {
        values.push(albumId, img.url, img.fileName);
        const base = idx * 3 + 1;
        return `($${base}, $${base + 1}, $${base + 2})`;
      })
      .join(', ');

    await pool.query(
      `INSERT INTO images (album_id, url, file_name) VALUES ${placeholders}`,
      values
    );
  }

  const added = newImages.length;

  return {
    added,
    total: driveImages.length,
    skipped: driveImages.length - added,
    message: `Đã thêm ${added} ảnh mới, cập nhật tên ${driveImages.length} file`,
  };
};
