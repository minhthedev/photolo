const imageService = require('../services/imageService');
const albumService = require('../services/albumService');

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const fetchWithTimeout = async (url, ms = 25000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(url, { redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const sendBufferedImage = async (res, response) => {
  const contentType = response.headers.get('content-type') || 'image/jpeg';

  if (contentType.includes('text/html')) {
    return false;
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (!buffer.length) {
    return false;
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    res.status(413).json({ message: 'Ảnh quá lớn để proxy' });
    return true;
  }

  res.set('Content-Type', contentType);
  res.set('Content-Length', buffer.length);
  res.set('Cache-Control', 'public, max-age=604800, immutable');
  res.send(buffer);
  return true;
};

exports.addImage = async (req, res) => {
  try {
    const { album_id, albumId, url } = req.body;
    const resolvedAlbumId = album_id || albumId;

    if (!resolvedAlbumId || !url?.trim()) {
      return res.status(400).json({ message: 'album_id and url are required' });
    }

    const allowed = await albumService.canManageAlbum(resolvedAlbumId, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'Bạn không có quyền với album này' });
    }

    const image = await imageService.addImage({
      albumId: resolvedAlbumId,
      url,
    });

    if (!image) {
      return res.status(404).json({ message: 'Album not found' });
    }

    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add image', error: error.message });
  }
};

exports.getImagesByAlbum = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 24));

    const data = await imageService.getImagesByAlbum(req.params.albumId, { page, limit });

    if (!data) {
      return res.status(404).json({ message: 'Album not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch images', error: error.message });
  }
};

exports.getSelectedImagesByAlbum = async (req, res) => {
  try {
    const images = await imageService.getSelectedImagesByAlbum(req.params.albumId);

    if (images === null) {
      return res.status(404).json({ message: 'Album not found' });
    }

    res.json({ images, selectedCount: images.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch selected images', error: error.message });
  }
};

exports.toggleSelection = async (req, res) => {
  try {
    const image = await imageService.toggleSelection(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.json(image);
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle selection', error: error.message });
  }
};

exports.updateClientNote = async (req, res) => {
  try {
    const { note, client_note, clientNote } = req.body;
    const resolvedNote = note ?? client_note ?? clientNote ?? '';

    const image = await imageService.updateClientNote(req.params.id, resolvedNote);

    if (!image) {
      return res.status(404).json({ message: 'Image not found or not selected' });
    }

    res.json(image);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update note', error: error.message });
  }
};

exports.proxyDriveImage = async (req, res) => {
  const { fileId } = req.params;

  try {
    const apiKey = process.env.GOOGLE_API_KEY?.trim();

    const sources = [
      `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`,
    ];

    if (apiKey) {
      sources.push(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&key=${encodeURIComponent(apiKey)}&supportsAllDrives=true`
      );
    }

    for (const url of sources) {
      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) continue;

        const sent = await sendBufferedImage(res, response);
        if (sent) return;
      } catch (err) {
        console.warn('Proxy source failed:', fileId, err.message);
      }
    }

    if (!res.headersSent) {
      res.status(502).json({
        message: 'Không thể tải ảnh từ Drive. Folder cần share "Anyone with the link".',
      });
    }
  } catch (error) {
    console.error('Proxy Drive image failed:', fileId, error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to proxy image', error: error.message });
    }
  }
};
