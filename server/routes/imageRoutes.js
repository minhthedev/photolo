const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/proxy/:fileId', imageController.proxyDriveImage);
router.patch('/:id/note', imageController.updateClientNote);
router.patch('/:id', imageController.toggleSelection);
router.get('/:albumId', imageController.getImagesByAlbum);

router.post('/', requireAuth, imageController.addImage);

module.exports = router;
