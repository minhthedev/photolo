const authService = require('../services/authService');
const albumService = require('../services/albumService');

exports.requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

exports.requireAlbumAccess = async (req, res, next) => {
  const albumId = req.params.id || req.params.albumId || req.body.album_id || req.body.albumId;

  if (!albumId) {
    return res.status(400).json({ message: 'Album id is required' });
  }

  const allowed = await albumService.canManageAlbum(albumId, req.user);
  if (!allowed) {
    return res.status(403).json({ message: 'Bạn không có quyền với album này' });
  }

  next();
};
